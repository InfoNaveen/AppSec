import { NextRequest, NextResponse } from 'next/server';
// Legacy orchestrator removed — scans now go through the LangGraph pipeline
import { runPipeline } from '@/lib/graph/index';
import { supabaseServiceRole } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prepareProjectFromStorage, cleanupProjectDir } from '@/lib/project-utils';

export async function POST(request: NextRequest) {
  let projectDir: string | null = null;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    // Validate input
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = supabaseServiceRole();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });
    }

    // Prepare project from storage
    const storagePath = `projects/${projectId}/source.zip`;
    try {
      projectDir = await prepareProjectFromStorage(projectId, storagePath);
    } catch (error: any) {
      // Try generated code if source doesn't exist
      const generatedPath = `projects/${projectId}/generated.zip`;
      try {
        projectDir = await prepareProjectFromStorage(projectId, generatedPath);
      } catch (genError: any) {
        return NextResponse.json({ 
          success: false, 
          error: `Failed to load project: ${error.message}` 
        }, { status: 500 });
      }
    }

    // Enqueue the new LangGraph pipeline instead of the old orchestrator
    const crypto = require('crypto');
    const scanId = crypto.randomUUID();
    const checkpointId = crypto.randomUUID();

    // Insert scan row for the new pipeline
    const { error: insertError } = await supabase
      .from('scans')
      .insert({
        id: scanId,
        project_id: projectId,
        repo_url: project.repo_url || `project://${projectId}`,
        status: 'queued',
        triggered_by: 'legacy_scan',
        current_agent: 'queued',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json({ success: false, error: 'Failed to create scan record' }, { status: 500 });
    }

    // Fire pipeline — DO NOT await
    runPipeline({
      repoPath: projectDir || '',
      repoUrl: project.repo_url || '',
      scanId,
      triggeredBy: 'manual',
      omiumTraceId: 'devsentinel-' + scanId,
    }).catch(err => console.error('Pipeline error:', err));

    // Return immediately with scanId
    return NextResponse.json({
      success: true,
      scanId,
      message: 'Pipeline enqueued — poll /api/scan/status/' + scanId + ' for progress',
    });
  } catch (error: any) {
    console.error('Scan error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  } finally {
    if (projectDir) {
      await cleanupProjectDir(projectDir);
    }
  }
}
