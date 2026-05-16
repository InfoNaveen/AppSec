/**
 * POST /api/scan/trigger — Manual scan trigger (auth gated)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { runPipeline } from '@/lib/graph/index';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as path from 'path';

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate input
    const body = await request.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 });
    }

    // Basic GitHub URL validation
    if (!repoUrl.match(/^https?:\/\/(www\.)?github\.com\//)) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    // 3. Generate IDs
    const scanId = crypto.randomUUID();
    const omiumTraceId = 'secureforge-' + scanId;

    // 4. Clone repo
    const repoPath = path.join(process.env.TEMP || process.env.TMP || '/tmp', scanId);
    await execFileAsync('git', ['clone', '--depth=1', repoUrl, repoPath], { timeout: 60000 });

    // 5. Insert scan
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    await supabase.from('scans').insert({
      id: scanId,
      repo_url: repoUrl,
      repo_path: repoPath,
      triggered_by: 'manual',
      status: 'queued',
      omium_trace_id: omiumTraceId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 6. Fire pipeline — DO NOT await
    runPipeline({
      scanId,
      repoPath,
      repoUrl,
      triggeredBy: 'manual',
      omiumTraceId,
    }).catch(err => console.error('[Trigger] Pipeline error:', err));

    // 7. Return 202
    return NextResponse.json({ scanId }, { status: 202 });
  } catch (err: any) {
    console.error('[Trigger] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
