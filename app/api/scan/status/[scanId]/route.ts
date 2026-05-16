/**
 * GET /api/scan/status/[scanId] — Scan status polling (auth gated)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { scanId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanId } = params;
    if (!scanId) {
      return NextResponse.json({ error: 'scanId is required' }, { status: 400 });
    }

    // MOCK DEMO MODE
    const { getMockScanProgression, MOCK_FINDINGS, MOCK_PATCHES } = require('@/lib/mock-db');
    const scan = getMockScanProgression(scanId);

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const severityCounts = {
      critical: 1, high: 1, medium: 1, low: 0,
    };

    return NextResponse.json({ 
      scan, 
      severityCounts,
      findings: MOCK_FINDINGS,
      patches: MOCK_PATCHES 
    });
  } catch (err: any) {
    console.error('[Status] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
