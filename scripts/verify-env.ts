/**
 * DevSentinel AI — Environment Verification Script
 * Run with: npx tsx scripts/verify-env.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { execFile } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);

const results: { label: string; status: '✅' | '❌' | '⚠️'; detail: string }[] = [];

function log(status: '✅' | '❌' | '⚠️', label: string, detail: string) {
  results.push({ label, status, detail });
  console.log(`${status} ${label}: ${detail}`);
}

async function checkLLM() {
  console.log('\n━━━ 1. LLM CHECK ━━━');
  try {
    // We can't import TS modules directly, so we inline the logic
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!groqKey && !openaiKey && !anthropicKey) {
      log('❌', 'LLM', 'No API keys configured (ANTHROPIC, GROQ, or OPENAI)');
      return;
    }

    // Try Groq first (it's set as primary)
    if (groqKey) {
      const Groq = (await import('groq-sdk')).default;
      const client = new Groq({ apiKey: groqKey });
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Reply with exactly: DEVSENTINEL_LLM_OK' },
        ],
        temperature: 0,
        max_tokens: 50,
      });
      const reply = completion.choices[0]?.message?.content || '';
      if (reply.includes('DEVSENTINEL_LLM_OK')) {
        log('✅', 'LLM', `Groq working — got "${reply.trim()}"`);
      } else {
        log('⚠️', 'LLM', `Groq responded but unexpected: "${reply.trim()}"`);
      }
      return;
    }

    if (openaiKey) {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey: openaiKey });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Reply with exactly: DEVSENTINEL_LLM_OK' },
        ],
        temperature: 0,
        max_tokens: 50,
      });
      const reply = completion.choices[0]?.message?.content || '';
      log('✅', 'LLM', `OpenAI working — got "${reply.trim()}"`);
      return;
    }
  } catch (err: any) {
    log('❌', 'LLM', `FAILED: ${err.message}`);
  }
}

async function checkSupabase() {
  console.log('\n━━━ 2. SUPABASE CHECK ━━━');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    log('❌', 'Supabase', 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  try {
    const supabase = createClient(url, key);

    // INSERT test row
    const testId = crypto.randomUUID();
    const { error: insertErr } = await supabase.from('scans').insert({
      id: testId,
      repo_url: 'https://github.com/test/verify-env',
      status: 'test',
      triggered_by: 'verify-env',
    });
    if (insertErr) {
      log('❌', 'Supabase', `INSERT failed: ${insertErr.message}`);
      return;
    }

    // SELECT it back
    const { data, error: selectErr } = await supabase.from('scans').select('*').eq('id', testId).single();
    if (selectErr || !data) {
      log('❌', 'Supabase', `SELECT failed: ${selectErr?.message || 'no data'}`);
      return;
    }

    // DELETE it
    const { error: deleteErr } = await supabase.from('scans').delete().eq('id', testId);
    if (deleteErr) {
      log('⚠️', 'Supabase', `Connected (INSERT+SELECT ok) but DELETE failed: ${deleteErr.message}`);
      return;
    }

    log('✅', 'Supabase', 'Connected — INSERT, SELECT, DELETE all working');
  } catch (err: any) {
    log('❌', 'Supabase', `FAILED: ${err.message}`);
  }
}

async function checkDiscord() {
  console.log('\n━━━ 3. DISCORD CHECK ━━━');
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    log('⚠️', 'Discord', 'DISCORD_WEBHOOK_URL not configured (skip)');
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '🔧 DevSentinel AI — environment verification test' }),
    });

    if (res.ok || res.status === 204) {
      log('✅', 'Discord', 'Webhook working — test message sent');
    } else {
      log('❌', 'Discord', `Webhook returned ${res.status}: ${await res.text()}`);
    }
  } catch (err: any) {
    log('❌', 'Discord', `FAILED: ${err.message}`);
  }
}

async function checkOmium() {
  console.log('\n━━━ 4. OMIUM CHECK ━━━');
  const key = process.env.OMIUM_API_KEY;
  if (!key) {
    log('⚠️', 'Omium', 'OMIUM_API_KEY not configured (skip)');
    return;
  }

  try {
    // Omium uses auto-instrumentation SDK, not manual REST trace creation.
    // Test with GET /executions to verify the key is valid.
    const res = await fetch('https://api.omium.ai/api/v1/executions', {
      method: 'GET',
      headers: {
        'X-API-Key': key,
      },
    });

    if (res.ok) {
      log('✅', 'Omium', `API key valid (status ${res.status})`);
    } else if (res.status === 401 || res.status === 403) {
      log('❌', 'Omium', `API key invalid (status ${res.status})`);
    } else {
      // Any other status — treat as warning, our lib/omium.ts silently no-ops
      log('⚠️', 'Omium', `API returned ${res.status} — lib/omium.ts will silently no-op (safe)`);
    }
  } catch (err: any) {
    log('⚠️', 'Omium', `Network issue — lib/omium.ts will silently no-op (safe): ${err.message}`);
  }
}

async function checkTool(name: string, args: string[]) {
  try {
    const { stdout } = await execFileAsync(name, args, { timeout: 10000 });
    const version = stdout.trim().split('\n')[0];
    log('✅', name, version);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      log('❌', name, 'NOT INSTALLED');
    } else {
      log('❌', name, `Error: ${err.message?.split('\n')[0]}`);
    }
  }
}

async function checkTools() {
  console.log('\n━━━ 5. TOOL CHECK ━━━');
  await checkTool('git', ['--version']);
  await checkTool('semgrep', ['--version']);
  await checkTool('bandit', ['--version']);
  await checkTool('pip-audit', ['--version']);
}

async function checkGitHub() {
  console.log('\n━━━ 6. GITHUB CHECK ━━━');
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    log('⚠️', 'GitHub', 'GITHUB_TOKEN not configured (skip)');
    return;
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevSentinel-AI',
      },
    });

    if (res.ok) {
      const data = await res.json();
      log('✅', 'GitHub', `Token valid for user: ${data.login}`);
    } else {
      log('❌', 'GitHub', `API returned ${res.status}: ${await res.text()}`);
    }
  } catch (err: any) {
    log('❌', 'GitHub', `FAILED: ${err.message}`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   DevSentinel AI — Environment Verification     ║');
  console.log('╚══════════════════════════════════════════════════╝');

  await checkLLM();
  await checkSupabase();
  await checkDiscord();
  await checkOmium();
  await checkTools();
  await checkGitHub();

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                  SUMMARY                        ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const pass = results.filter(r => r.status === '✅').length;
  const warn = results.filter(r => r.status === '⚠️').length;
  const fail = results.filter(r => r.status === '❌').length;

  console.log(`\n   ✅ ${pass} passed   ⚠️ ${warn} warnings   ❌ ${fail} failures\n`);

  if (fail > 0) {
    console.log('   ❌ FIX FAILURES BEFORE PROCEEDING TO STEP 2\n');
    process.exit(1);
  } else {
    console.log('   🟢 READY FOR STEP 2 — PIPELINE SMOKE TEST\n');
    process.exit(0);
  }
}

main();
