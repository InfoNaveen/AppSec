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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Get scan (service role for now — user filtering optional for hackathon)
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Get severity counts from findings
    const { data: findings } = await supabase
      .from('findings')
      .select('severity')
      .eq('scan_id', scanId);

    const severityCounts = {
      critical: 0, high: 0, medium: 0, low: 0,
    };
    if (findings) {
      for (const f of findings) {
        const s = f.severity as keyof typeof severityCounts;
        if (s in severityCounts) severityCounts[s]++;
      }
    }

    return NextResponse.json({ scan, severityCounts });
  } catch (err: any) {
    console.error('[Status] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
