/**
 * Agent 1 — Codebase Intelligence Agent
 * Walks repo, detects language, builds architecture map via LLM.
 */
import { AgentState, Finding } from '../state';
import { callLLM } from '../../llm';
import { startSpan, endSpan, logToolCall } from '../../omium';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SKIP_DIRS = new Set([
  'node_modules', '.git', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next',
]);
const INTERESTING_EXTS = new Set([
  '.py', '.js', '.ts', '.env', '.cfg', '.ini', '.toml', '.yaml', '.yml',
]);

interface FileEntry { relativePath: string; size: number; }

function walkDir(dir: string, base: string, depth: number, maxDepth: number): FileEntry[] {
  if (depth > maxDepth) return [];
  const entries: FileEntry[] = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (SKIP_DIRS.has(item.name)) continue;
      const fullPath = path.join(dir, item.name);
      const relPath = path.relative(base, fullPath);
      if (item.isDirectory()) {
        entries.push(...walkDir(fullPath, base, depth + 1, maxDepth));
      } else {
        const ext = path.extname(item.name).toLowerCase();
        if (INTERESTING_EXTS.has(ext) || item.name.startsWith('.env')) {
          try {
            const stat = fs.statSync(fullPath);
            entries.push({ relativePath: relPath, size: stat.size });
          } catch { /* skip */ }
        }
      }
    }
  } catch { /* skip unreadable dirs */ }
  return entries;
}

function detectLanguage(repoPath: string): 'python' | 'node' | 'unknown' {
  const files = fs.readdirSync(repoPath);
  if (files.some(f => ['requirements.txt', 'pyproject.toml', 'setup.py'].includes(f))) return 'python';
  if (files.includes('package.json')) return 'node';
  return 'unknown';
}

function isHighRiskFile(filePath: string): boolean {
  const name = path.basename(filePath).toLowerCase();
  const highRisk = ['app.py', 'main.py', 'wsgi.py', 'asgi.py', 'run.py', 'server.py',
    'auth.py', 'login.py', 'config.py', 'settings.py', 'database.py', 'db.py',
    'models.py', 'routes.py', 'views.py', 'api.py', 'index.ts', 'index.js',
    'server.ts', 'server.js'];
  return highRisk.includes(name) || filePath.includes('auth') || filePath.includes('config');
}

export async function agent1Mapper(state: AgentState): Promise<Partial<AgentState>> {
  const spanId = await startSpan(state.omiumTraceId, 'agent1_mapper', {
    agentName: 'Codebase Intelligence Agent',
  });

  try {
    console.log('[Agent1] Mapping codebase...');
    // 1. Walk directory
    const fileEntries = walkDir(state.repoPath, state.repoPath, 0, 6);
    console.log(`[Agent1] Found ${fileEntries.length} interesting files`);

    // 2. Detect language
    const language = detectLanguage(state.repoPath);
    console.log(`[Agent1] Detected language: ${language}`);

    // 3. Build file tree string
    const fileTree = fileEntries
      .map(f => `${f.relativePath} (${f.size}b)`)
      .join('\n');

    // 4. Sample high-risk files (up to 8, 200 lines each)
    const highRiskFiles = fileEntries
      .filter(f => isHighRiskFile(f.relativePath))
      .slice(0, 8);

    let sampledContent = '';
    for (const file of highRiskFiles) {
      try {
        const fullPath = path.join(state.repoPath, file.relativePath);
        // Skip .env files — never send to LLM
        if (file.relativePath.match(/\.env/)) continue;
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').slice(0, 200).join('\n');
        sampledContent += `\n--- ${file.relativePath} ---\n${lines}\n`;
      } catch { /* skip unreadable */ }
    }

    // 5. Call LLM for architecture analysis
    const t0 = Date.now();
    const llmResult = await callLLM(
      'You are a security-focused code architect. Analyze this repository structure and identify the attack surface. Return JSON only.',
      `File tree:\n${fileTree}\n\nSampled file contents:\n${sampledContent}`,
      { json: true }
    );
    const durationMs = Date.now() - t0;

    let architectureMap: object = {};
    try {
      architectureMap = JSON.parse(llmResult);
    } catch {
      architectureMap = { raw: llmResult, parseError: true };
    }

    await logToolCall(spanId, {
      name: 'callLLM',
      input: { prompt: 'architecture_analysis', fileCount: fileEntries.length },
      output: { architectureMap },
      durationMs,
    });

    // 6. Update Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    await supabase.from('scans').update({
      current_agent: 'agent1_mapper',
      language,
      updated_at: new Date().toISOString(),
    }).eq('id', state.scanId);

    await endSpan(spanId, {
      status: 'success',
      output: { language, fileCount: fileEntries.length, highRiskFiles: highRiskFiles.length },
    });

    console.log(`[Agent1] ✅ Complete — ${fileEntries.length} files, ${highRiskFiles.length} high-risk, language: ${language}`);
    return {
      architectureMap,
      language,
      currentAgent: 'agent1_mapper',
    };
  } catch (err: any) {
    await endSpan(spanId, { status: 'failed', errorMessage: err.message });
    return {
      errors: [...state.errors, `agent1_mapper: ${err.message}`],
      language: 'unknown',
      architectureMap: null,
      currentAgent: 'agent1_mapper',
    };
  }
}
