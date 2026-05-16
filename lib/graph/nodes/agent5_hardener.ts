/**
 * Agent 5 — Security Hardening Agent
 * Adds rate limiting, security headers, CORS lockdown, SECRET_KEY from env.
 */
import { AgentState } from '../state';
import { callLLM } from '../../llm';
import { startSpan, endSpan, logToolCall } from '../../omium';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const ENTRY_POINT_NAMES = ['app.py', 'main.py', 'run.py', 'wsgi.py', 'asgi.py'];

export async function agent5Hardener(state: AgentState): Promise<Partial<AgentState>> {
  const spanId = await startSpan(state.omiumTraceId, 'agent5_hardener', {
    agentName: 'Security Hardening Agent',
  });

  try {
    console.log('[Agent5] Starting security hardening...');
    // 1. Find entry point file
    let entryPointFile: string | null = null;
    for (const name of ENTRY_POINT_NAMES) {
      const fullPath = path.join(state.repoPath, name);
      if (fs.existsSync(fullPath)) {
        entryPointFile = name;
        break;
      }
    }

    if (!entryPointFile) {
      console.log('[Agent5] No entry point file found, skipping hardening');
      await endSpan(spanId, {
        status: 'success',
        output: { skipped: true, reason: 'no_entry_point' },
      });
      return { hardeningApplied: [], currentAgent: 'agent5_hardener' };
    }

    // 2. Read entry point
    const entryPointPath = path.join(state.repoPath, entryPointFile);
    const entryPointContent = fs.readFileSync(entryPointPath, 'utf-8');

    // 3. Call LLM for hardening
    const t0 = Date.now();
    const llmResult = await callLLM(
      'You are a Python security hardening expert. Add security hardening to this Flask/FastAPI app entry point. Return JSON only: { "hardenedCode": string, "addedMeasures": string[] }. Add ONLY: rate limiting, security headers, explicit CORS origins (not *), SECRET_KEY from env. Do not change any business logic.',
      `Entry point file (${entryPointFile}):\n${entryPointContent}\n\nArchitecture: ${JSON.stringify(state.architectureMap)}`,
      { json: true }
    );
    await logToolCall(spanId, {
      name: 'callLLM',
      input: { entryPointFile },
      output: { raw: llmResult.slice(0, 200) },
      durationMs: Date.now() - t0,
    });

    const parsed = JSON.parse(llmResult);
    const hardenedCode = parsed.hardenedCode || entryPointContent;
    const addedMeasures: string[] = parsed.addedMeasures || [];

    // 4. Write hardened entry point to _patched/ mirror
    const patchedDir = state.repoPath + '_patched';
    const destPath = path.join(patchedDir, entryPointFile);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, hardenedCode, 'utf-8');

    await logToolCall(spanId, {
      name: 'file_write',
      input: { filePath: destPath },
      output: { bytesWritten: Buffer.byteLength(hardenedCode, 'utf-8'), measures: addedMeasures },
      durationMs: 0,
    });

    // 5. Update Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    await supabase.from('scans').update({
      current_agent: 'agent5_hardener',
      hardening_count: addedMeasures.length,
      updated_at: new Date().toISOString(),
    }).eq('id', state.scanId);

    await endSpan(spanId, {
      status: 'success',
      output: { hardeningApplied: addedMeasures },
    });

    console.log(`[Agent5] ✅ Complete — ${addedMeasures.length} hardening measures applied: ${addedMeasures.join(', ')}`);
    return {
      hardeningApplied: addedMeasures,
      currentAgent: 'agent5_hardener',
    };
  } catch (err: any) {
    await endSpan(spanId, { status: 'failed', errorMessage: err.message });
    return {
      hardeningApplied: [],
      errors: [...state.errors, `agent5_hardener: ${err.message}`],
      currentAgent: 'agent5_hardener',
    };
  }
}
