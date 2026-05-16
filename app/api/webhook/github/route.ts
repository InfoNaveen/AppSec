/**
 * POST /api/webhook/github — GitHub push webhook handler
 * Public endpoint (no auth) — validates HMAC signature.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runPipeline } from '@/lib/graph/index';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as path from 'path';

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body
    const rawBody = await request.text();

    // 2. Validate HMAC signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = request.headers.get('x-hub-signature-256');

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Missing webhook secret or signature' }, { status: 401 });
    }

    const expected = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Check event type
    const event = request.headers.get('x-github-event');
    if (event !== 'push') {
      return NextResponse.json({ message: 'Event ignored', event }, { status: 200 });
    }

    // 4. Parse body
    const body = JSON.parse(rawBody);
    const repoUrl: string = body.repository?.clone_url;
    if (!repoUrl) {
      return NextResponse.json({ error: 'No clone_url in payload' }, { status: 400 });
    }

    // 5. Generate IDs
    const scanId = crypto.randomUUID();
    const omiumTraceId = 'devsentinel-' + scanId;

    // 6. Clone repo
    const repoPath = path.join('/tmp', scanId);
    await execFileAsync('git', ['clone', '--depth=1', repoUrl, repoPath], { timeout: 60000 });

    // 7. Insert scan into Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    await supabase.from('scans').insert({
      id: scanId,
      repo_url: repoUrl,
      repo_path: repoPath,
      triggered_by: 'webhook',
      status: 'queued',
      omium_trace_id: omiumTraceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 8. Fire pipeline in background — DO NOT await
    runPipeline({
      scanId,
      repoPath,
      repoUrl,
      triggeredBy: 'webhook',
      omiumTraceId,
    }).catch(err => console.error('[Webhook] Pipeline error:', err));

    // 9. Return 202
    return NextResponse.json({ scanId, message: 'Scan queued' }, { status: 202 });
  } catch (err: any) {
    console.error('[Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
