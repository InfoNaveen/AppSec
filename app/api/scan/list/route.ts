/**
 * GET /api/scan/list — Get recent scans
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // MOCK DEMO MODE
    const { mockDb } = require('@/lib/mock-db');
    const scans = Array.from(mockDb.scans.values()).reverse().slice(0, 10);
    return NextResponse.json(scans);
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
