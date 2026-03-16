import { NextRequest, NextResponse } from 'next/server';
import { RedTeamValidationGate } from '@/services/offensive_engine/neurosploit-integration';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { scanRateLimit } from '@/lib/rate-limit';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // SECURITY FIX: Rate Limiting
    if (scanRateLimit) {
      const { success, reset } = await scanRateLimit.limit(userId);
      if (!success) {
        return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { 
          status: 429,
          headers: { 'Retry-After': Math.max(0, Math.ceil((reset - Date.now()) / 1000)).toString() }
        });
      }
    }

    const body = await request.json();
    const { projectPath } = body;

    // Validate input
    if (!projectPath) {
      return NextResponse.json({ success: false, error: 'Project path is required' }, { status: 400 });
    }

    // SECURITY FIX: Path Traversal Fix
    const safePath = path.resolve(projectPath);
    const allowedPath = path.resolve(os.tmpdir());

    if (!safePath.startsWith(allowedPath + path.sep) && safePath !== allowedPath) {
      return NextResponse.json({ success: false, error: 'Invalid project path' }, { status: 401 });
    }

    // Initialize Red Team Validation Gate
    const redTeamGate = new RedTeamValidationGate(safePath);
    
    // Run red team validation
    const results = await redTeamGate.runValidation();

    return NextResponse.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Red team scan error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}