/**
 * Agent 4 — Autonomous Remediation Agent
 * Generates secure code replacements for critical/high vulnerabilities.
 * Writes patched files to repoPath + "_patched/" mirror.
 */
import { AgentState, Patch } from '../state';
import { callLLM } from '../../llm';
import { startSpan, endSpan, logToolCall } from '../../omium';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export async function agent4Remediator(state: AgentState): Promise<Partial<AgentState>> {
  const spanId = await startSpan(state.omiumTraceId, 'agent4_remediator', {
    agentName: 'Autonomous Remediation Agent',
  });

  try {
    console.log('[Agent4] Starting autonomous remediation...');
    const patches: Patch[] = [];

    // Filter: only critical/high, not false positive
    const toRemediate = state.triageResults.filter(
      f => (f.severity === 'critical' || f.severity === 'high') && f.status !== 'false_positive'
    );
    console.log(`[Agent4] Remediating ${toRemediate.length} critical/high findings...`);

    for (const finding of toRemediate) {
      try {
        // Check if this is a dependency finding (from pip-audit)
        const isDependency = finding.ruleId.startsWith('PYSEC-') ||
          finding.ruleId.startsWith('CVE-') ||
          finding.filePath === 'requirements.txt';

        if (isDependency) {
          // Don't rewrite code — record as dependency patch
          const packageName = finding.vulnerableCode?.split('==')[0] || finding.description.split('==')[0]?.split(':')[0]?.trim() || '';
          patches.push({
            findingId: finding.id,
            originalCode: finding.vulnerableCode || '',
            patchedCode: `pip install ${packageName} --upgrade  # Upgrade to latest secure version`,
            filePath: finding.filePath,
            patchType: 'dependency',
          });
          continue;
        }

        // Read full file content
        const fullPath = path.isAbsolute(finding.filePath) 
          ? finding.filePath 
          : path.join(state.repoPath, finding.filePath);
          
        if (!fs.existsSync(fullPath)) {
          console.error(`[Agent4] File not found: ${fullPath}`);
          continue;
        }
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        
        // Ensure relative path for _patched mirror
        const relativePath = path.isAbsolute(finding.filePath)
          ? path.relative(state.repoPath, finding.filePath)
          : finding.filePath;

        // Call LLM for patch
        const t0 = Date.now();
        const llmResult = await callLLM(
          'You are a Python security engineer. Generate a secure code replacement. Return JSON only with fields: patchedCode (string), explanation (string).',
          `File: ${finding.filePath}\nVulnerable code:\n${finding.vulnerableCode}\n\nFinding: ${finding.description}\n${finding.advisoryNote ? 'Advisory: ' + finding.advisoryNote : ''}\n\nFull file content:\n${fileContent}`,
          { json: true }
        );
        await logToolCall(spanId, {
          name: 'callLLM',
          input: { findingId: finding.id, filePath: finding.filePath },
          output: { raw: llmResult.slice(0, 200) },
          durationMs: Date.now() - t0,
        });

        const parsed = JSON.parse(llmResult);

        // Write patched file to _patched/ mirror
        const patchedDir = state.repoPath + '_patched';
        const destPath = path.join(patchedDir, relativePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });

        // Replace vulnerable section in full file content
        let patchedFileContent = fileContent;
        if (finding.vulnerableCode && parsed.patchedCode) {
          patchedFileContent = fileContent.replace(finding.vulnerableCode, parsed.patchedCode);
        } else if (parsed.patchedCode) {
          patchedFileContent = parsed.patchedCode;
        }

        fs.writeFileSync(destPath, patchedFileContent, 'utf-8');
        const bytesWritten = Buffer.byteLength(patchedFileContent, 'utf-8');

        await logToolCall(spanId, {
          name: 'file_write',
          input: { filePath: destPath },
          output: { bytesWritten },
          durationMs: 0,
        });

        patches.push({
          findingId: finding.id,
          originalCode: finding.vulnerableCode || '',
          patchedCode: parsed.patchedCode || '',
          filePath: finding.filePath,
          patchType: 'code',
        });
      } catch (err: any) {
        console.error(`[Agent4] Remediation failed for ${finding.id}:`, err.message);
      }
    }

    // Mark remediated findings as patched
    const patchedIds = new Set(patches.map(p => p.findingId));
    const updatedTriage = state.triageResults.map(f =>
      patchedIds.has(f.id) ? { ...f, status: 'patched' as const } : f
    );

    // Update Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    await supabase.from('scans').update({
      current_agent: 'agent4_remediator',
      patches_count: patches.length,
      updated_at: new Date().toISOString(),
    }).eq('id', state.scanId);

    await endSpan(spanId, {
      status: 'success',
      output: { patchesGenerated: patches.length },
    });

    console.log(`[Agent4] ✅ Complete — ${patches.length} patches generated`);
    return {
      patches,
      triageResults: updatedTriage,
      currentAgent: 'agent4_remediator',
    };
  } catch (err: any) {
    await endSpan(spanId, { status: 'failed', errorMessage: err.message });
    return {
      patches: [],
      errors: [...state.errors, `agent4_remediator: ${err.message}`],
      currentAgent: 'agent4_remediator',
    };
  }
}
