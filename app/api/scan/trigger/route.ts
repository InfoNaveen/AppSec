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
    const body = await request.json();
    const { repoUrl } = body;
    const scanId = crypto.randomUUID();

    // MOCK DEMO MODE: Initialize in-memory state
    const { mockDb } = require('@/lib/mock-db');
    mockDb.startTime.set(scanId, Date.now());
    mockDb.scans.set(scanId, {
      id: scanId,
      repo_url: repoUrl || 'https://github.com/InfoNaveen/vulnerable-demo-app',
      status: 'queued',
      current_agent: 'queued',
      findings_count: 0,
      patches_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ scanId }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
