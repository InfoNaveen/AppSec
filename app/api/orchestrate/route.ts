import { NextRequest, NextResponse } from 'next/server';
// Legacy orchestrator removed — orchestration now goes through LangGraph pipeline
import { runPipeline } from '@/lib/graph/index';
import { supabaseServiceRole } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prepareProjectFromStorage, cleanupProjectDir } from '@/lib/project-utils';
import { generateCodeFromStory } from '@/lib/code-generator';
import { uploadToStorage } from '@/lib/storage-utils';
import { promises as fs } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

async function zipDirectory(dirPath: string): Promise<Buffer> {
  const zip = new AdmZip();
  zip.addLocalFolder(dirPath);
  return zip.toBuffer();
}

export async function POST(request: NextRequest) {
  let projectDir: string | null = null;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, userStory } = body;

    // Validate input
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = supabaseServiceRole();

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id) // Ensure user owns the project
      .single();

    if (projectError || !project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });
    }

    // Log start event
    await supabase
      .from('timeline_events')
      .insert([
        {
          project_id: projectId,
          event_type: 'orchestrate_start',
          event_message: 'Starting multi-agent orchestration pipeline'
        }
      ]);

    // Prepare project directory
    const tmpDir = require('os').tmpdir();
    projectDir = path.join(tmpDir, `SecureForge-${projectId}-${Date.now()}`);
    await fs.mkdir(projectDir, { recursive: true });

    // Handle user story code generation
    if (userStory) {
      try {
        // Generate code from user story
        const { architecture, generatedFiles, feedback } = await generateCodeFromStory(userStory, projectDir);

        // Log generation event
        await supabase
          .from('timeline_events')
          .insert([
            {
              project_id: projectId,
              event_type: 'code_generated',
              event_message: `Generated ${generatedFiles.length} files from user story`
            }
          ]);

        // Upload generated code to storage
        const zipBuffer = await zipDirectory(projectDir);
        const storagePath = `projects/${projectId}/generated.zip`;
        await uploadToStorage(storagePath, zipBuffer, 'application/zip');

        // Store architecture JSON in storage
        const architecturePath = `projects/${projectId}/architecture.json`;
        await uploadToStorage(architecturePath, Buffer.from(JSON.stringify(architecture, null, 2)), 'application/json');
      } catch (error: any) {
        console.error('Code generation error:', error);
        await supabase
          .from('timeline_events')
          .insert([
            {
              project_id: projectId,
              event_type: 'code_generation_error',
              event_message: `Code generation failed: ${error.message}`
            }
          ]);
        // Continue with scanning even if generation had issues
      }
    } else if (project.repo_url) {
      // Project has source in storage - download it
      const storagePath = `projects/${projectId}/source.zip`;
      try {
        const extractedDir = await prepareProjectFromStorage(projectId, storagePath);
        // Move contents to projectDir
        const entries = await fs.readdir(extractedDir, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(extractedDir, entry.name);
          const destPath = path.join(projectDir, entry.name);
          if (entry.isDirectory()) {
            await fs.cp(srcPath, destPath, { recursive: true });
          } else {
            await fs.copyFile(srcPath, destPath);
          }
        }
        await fs.rm(extractedDir, { recursive: true, force: true });
      } catch (error: any) {
        console.error('Failed to load project from storage:', error);
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
    await supabase.from('scans').insert({
      id: scanId,
      project_id: projectId,
      repo_url: project.repo_url || `project://${projectId}`,
      status: 'queued',
      triggered_by: 'orchestrate',
      current_agent: 'queued',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Log start event
    await supabase.from('timeline_events').insert([{
      project_id: projectId,
      event_type: 'pipeline_enqueued',
      event_message: 'LangGraph multi-agent pipeline enqueued',
    }]);

    // Fire pipeline — DO NOT await
    runPipeline({
      repoPath: projectDir || '',
      repoUrl: project.repo_url || '',
      scanId,
      triggeredBy: 'manual',
      omiumTraceId: 'secureforge-' + scanId,
    }).catch(err => console.error('Pipeline error:', err));

    return NextResponse.json({
      success: true,
      scanId,
      message: 'Pipeline enqueued — poll /api/scan/status/' + scanId,
    });
  } catch (error: any) {
    console.error('Orchestration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  } finally {
    // Clean up project directory
    if (projectDir) {
      await cleanupProjectDir(projectDir);
    }
  }
}
