/**
 * Agent 2 — Vulnerability Analysis Agent
 * Runs Semgrep, Bandit, pip-audit, Tavily CVE search, and LLM analysis.
 */
import { AgentState, Finding } from '../state';
import { callLLM } from '../../llm';
import { startSpan, endSpan, logToolCall } from '../../omium';
import { createClient } from '@supabase/supabase-js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const execFileAsync = promisify(execFile);

async function runTool(cmd: string, args: string[], spanId: string, toolName: string): Promise<any> {
  const t0 = Date.now();
  try {
    const { stdout } = await execFileAsync(cmd, args, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
    const parsed = JSON.parse(stdout);
    await logToolCall(spanId, {
      name: toolName,
      input: { cmd, args },
      output: { resultCount: Array.isArray(parsed?.results) ? parsed.results.length : 'unknown' },
      durationMs: Date.now() - t0,
    });
    return parsed;
  } catch (err: any) {
    // Some tools exit non-zero when they find issues — try parsing stdout anyway
    if (err.stdout) {
      try {
        const parsed = JSON.parse(err.stdout);
        await logToolCall(spanId, {
          name: toolName,
          input: { cmd, args },
          output: { resultCount: 'from_stderr', exitCode: err.code },
          durationMs: Date.now() - t0,
        });
        return parsed;
      } catch { /* fall through */ }
    }
    console.error(`[Agent2] ${toolName} failed:`, err.message);
    await logToolCall(spanId, {
      name: toolName,
      input: { cmd, args },
      output: { error: err.message },
      durationMs: Date.now() - t0,
    });
    return null;
  }
}

function parseSemgrepFindings(data: any): Finding[] {
  if (!data?.results) return [];
  return data.results.map((r: any) => ({
    id: crypto.randomUUID(),
    ruleId: r.check_id || 'semgrep-unknown',
    severity: mapSeverity(r.extra?.severity || 'WARNING'),
    filePath: r.path || '',
    lineStart: r.start?.line || 0,
    lineEnd: r.end?.line || 0,
    description: r.extra?.message || r.check_id || '',
    vulnerableCode: r.extra?.lines || '',
    status: 'open' as const,
  }));
}

function parseBanditFindings(data: any): Finding[] {
  if (!data?.results) return [];
  return data.results.map((r: any) => ({
    id: crypto.randomUUID(),
    ruleId: r.test_id || 'bandit-unknown',
    severity: mapSeverity(r.issue_severity || 'MEDIUM'),
    filePath: r.filename || '',
    lineStart: r.line_number || 0,
    lineEnd: r.end_col_offset ? r.line_number : r.line_number,
    description: r.issue_text || '',
    vulnerableCode: r.code || '',
    status: 'open' as const,
  }));
}

function parsePipAuditFindings(data: any): Finding[] {
  if (!data?.dependencies) return [];
  const findings: Finding[] = [];
  for (const dep of data.dependencies) {
    if (dep.vulns && dep.vulns.length > 0) {
      for (const vuln of dep.vulns) {
        findings.push({
          id: crypto.randomUUID(),
          ruleId: vuln.id || 'pip-audit',
          severity: mapSeverity(vuln.fix_versions?.length ? 'HIGH' : 'MEDIUM'),
          filePath: 'requirements.txt',
          lineStart: 0,
          lineEnd: 0,
          description: `${dep.name}==${dep.version}: ${vuln.description || vuln.id}`,
          vulnerableCode: `${dep.name}==${dep.version}`,
          cveId: vuln.aliases?.find((a: string) => a.startsWith('CVE-')) || vuln.id,
          status: 'open' as const,
        });
      }
    }
  }
  return findings;
}

function mapSeverity(s: string): 'critical' | 'high' | 'medium' | 'low' {
  const upper = s.toUpperCase();
  if (upper === 'ERROR' || upper === 'CRITICAL') return 'critical';
  if (upper === 'WARNING' || upper === 'HIGH') return 'high';
  if (upper === 'MEDIUM' || upper === 'INFO') return 'medium';
  return 'low';
}

function dedup(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter(f => {
    const key = `${f.filePath}:${f.lineStart}:${f.ruleId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchTavily(cveId: string, packageName: string, spanId: string): Promise<{ url?: string; note?: string }> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return {};
  const t0 = Date.now();
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query: `${cveId} python fix remediation ${packageName}`,
        max_results: 1,
      }),
    });
    const data = await res.json();
    const result = data?.results?.[0];
    await logToolCall(spanId, {
      name: 'tavily_search',
      input: { cveId, packageName },
      output: { url: result?.url || null },
      durationMs: Date.now() - t0,
    });
    return {
      url: result?.url,
      note: result?.content?.slice(0, 300),
    };
  } catch (err: any) {
    console.error('[Agent2] Tavily search failed:', err.message);
    return {};
  }
}

export async function agent2Scanner(state: AgentState): Promise<Partial<AgentState>> {
  const spanId = await startSpan(state.omiumTraceId, 'agent2_scanner', {
    agentName: 'Vulnerability Analysis Agent',
  });

  try {
    console.log('[Agent2] Starting vulnerability analysis...');
    const allFindings: Finding[] = [];

    // 1. Run Semgrep
    console.log('[Agent2] Running semgrep...');
    const semgrepData = await runTool('semgrep', [
      '--json', '--config=p/python', '--config=p/flask',
      '--config=p/owasp-top-ten', '--config=p/secrets', state.repoPath,
    ], spanId, 'semgrep');
    if (semgrepData) allFindings.push(...parseSemgrepFindings(semgrepData));
    console.log(`[Agent2] Semgrep: ${parseSemgrepFindings(semgrepData || {}).length} findings`);

    // 2. Run Bandit (Python only)
    if (state.language === 'python') {
      console.log('[Agent2] Running bandit...');
      const banditData = await runTool('bandit', [
        '-r', state.repoPath, '-f', 'json', '-ll',
      ], spanId, 'bandit');
      if (banditData) allFindings.push(...parseBanditFindings(banditData));
      console.log(`[Agent2] Bandit: ${parseBanditFindings(banditData || {}).length} findings`);
    }

    // 3. Run pip-audit
    const reqPath = path.join(state.repoPath, 'requirements.txt');
    if (fs.existsSync(reqPath)) {
      console.log('[Agent2] Running pip-audit...');
      const pipData = await runTool('pip-audit', [
        '--format=json', '-r', reqPath,
      ], spanId, 'pip-audit');
      if (pipData) allFindings.push(...parsePipAuditFindings(pipData));
      console.log(`[Agent2] pip-audit: ${parsePipAuditFindings(pipData || {}).length} findings`);
    }

    // 4. Deduplicate
    let findings = dedup(allFindings);

    // 5. Tavily CVE enrichment
    for (const f of findings) {
      if (f.cveId) {
        const pkg = f.description.split('==')[0]?.split(':')[0]?.trim() || '';
        const advisory = await searchTavily(f.cveId, pkg, spanId);
        if (advisory.url) f.advisoryUrl = advisory.url;
        if (advisory.note) f.advisoryNote = advisory.note;
      }
    }

    // 6. LLM additional findings
    const t0 = Date.now();
    try {
      const llmResult = await callLLM(
        'You are an expert AppSec engineer. Given the scan results and architecture, identify any additional vulnerabilities the static tools may have missed (logic flaws, insecure design). Return JSON: { "additionalFindings": [{ "ruleId": string, "severity": string, "filePath": string, "lineStart": number, "lineEnd": number, "description": string, "vulnerableCode": string }] }',
        `Architecture: ${JSON.stringify(state.architectureMap)}\n\nExisting findings (${findings.length}): ${JSON.stringify(findings.slice(0, 10))}`,
        { json: true }
      );
      await logToolCall(spanId, {
        name: 'callLLM',
        input: { prompt: 'additional_findings' },
        output: { raw: llmResult.slice(0, 200) },
        durationMs: Date.now() - t0,
      });
      const parsed = JSON.parse(llmResult);
      if (parsed.additionalFindings) {
        for (const af of parsed.additionalFindings) {
          findings.push({
            id: crypto.randomUUID(),
            ruleId: af.ruleId || 'llm-analysis',
            severity: mapSeverity(af.severity || 'medium'),
            filePath: af.filePath || '',
            lineStart: af.lineStart || 0,
            lineEnd: af.lineEnd || 0,
            description: af.description || '',
            vulnerableCode: af.vulnerableCode || '',
            status: 'open',
          });
        }
      }
    } catch (err: any) {
      console.error('[Agent2] LLM additional analysis failed:', err.message);
    }

    // 7. Deduplicate again after LLM additions
    findings = dedup(findings);

    // 8. Update Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    await supabase.from('scans').update({
      current_agent: 'agent2_scanner',
      findings_count: findings.length,
      updated_at: new Date().toISOString(),
    }).eq('id', state.scanId);

    await endSpan(spanId, {
      status: 'success',
      output: { findingsCount: findings.length },
    });

    console.log(`[Agent2] ✅ Complete — ${findings.length} total findings`);
    return { findings, currentAgent: 'agent2_scanner' };
  } catch (err: any) {
    await endSpan(spanId, { status: 'failed', errorMessage: err.message });
    return {
      findings: [],
      errors: [...state.errors, `agent2_scanner: ${err.message}`],
      currentAgent: 'agent2_scanner',
    };
  }
}
