import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { supabaseServiceRole } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { uploadToStorage } from '@/lib/storage-utils';
import AdmZip from 'adm-zip';
import { sanitizeUrl } from '@/lib/sanitizeUrl';
import { uploadRateLimit } from '@/lib/rate-limit';

const execFileAsync = promisify(execFile);

// Check magic bytes for ZIP (0x50 0x4B 0x03 0x04)
function isZipFile(buffer: Buffer): boolean {
  return buffer.length > 3 && 
         buffer[0] === 0x50 && 
         buffer[1] === 0x4B && 
         buffer[2] === 0x03 && 
         buffer[3] === 0x04;
}

/**
 * Cleanup old DevSentinel dirs in tmp
 */
async function cleanupOldTmpDirs() {
  try {
    const tmpDir = os.tmpdir();
    const entries = await fs.readdir(tmpDir, { withFileTypes: true });
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('DevSentinel-')) {
        const fullPath = path.join(tmpDir, entry.name);
        try {
          const stats = await fs.stat(fullPath);
          if (now - stats.mtimeMs > maxAge) {
            await fs.rm(fullPath, { recursive: true, force: true });
          }
        } catch (e) {
          // ignore stat/rm errors for individual files
        }
      }
    }
  } catch (err) {
    console.warn('Failed to clean up old temp dirs:', err);
  }
}

/**
 * Create a ZIP file from a directory
 */
async function zipDirectory(dirPath: string): Promise<Buffer> {
  const zip = new AdmZip();
  zip.addLocalFolder(dirPath);
  return zip.toBuffer();
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // SECURITY FIX: Rate Limiting
    if (uploadRateLimit) {
      const { success, reset } = await uploadRateLimit.limit(userId);
      if (!success) {
        return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { 
          status: 429,
          headers: { 'Retry-After': Math.max(0, Math.ceil((reset - Date.now()) / 1000)).toString() }
        });
      }
    }

    // Trigger cleanup of old temp directories on each upload request
    // SECURITY FIX: Cleanup Fix background job
    cleanupOldTmpDirs().catch(() => {});

    const supabase = supabaseServiceRole();

    // Check if it's a file upload, GitHub URL, or user story
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle ZIP file upload or user story
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const userStory = formData.get('userStory') as string | null;
      let projectName = (formData.get('projectName') as string) || `Project ${new Date().toISOString()}`;

      // Sanitize project name
      projectName = projectName.substring(0, 100).replace(/[<>\:"\/\\|?*]/g, '');

      // Create project in Supabase first to get UUID
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            name: projectName,
            user_id: userId,
            repo_url: null,
          }
        ])
        .select()
        .single();

      if (projectError || !project) {
        console.error('Error creating project:', projectError);
        return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
      }

      const projectId = project.id;
      const storagePath = `projects/${projectId}/source.zip`;

      if (userStory) {
        await supabase
          .from('timeline_events')
          .insert([
            {
              project_id: projectId,
              event_type: 'user_story',
              event_message: `User story received: ${userStory.substring(0, 200)}...`
            }
          ]);

        return NextResponse.json({
          success: true,
          projectId: projectId,
          userStory: userStory,
          type: 'user_story'
        });
      } else if (file) {
        // SECURITY FIX: File Upload Validation
        if (!file.type.includes('zip') && !file.type.includes('octet-stream')) {
          return NextResponse.json({ success: false, error: 'Invalid file type. Must be ZIP.' }, { status: 400 });
        }

        // Enforce 50MB max file size before reading fully into memory
        if (file.size > 50 * 1024 * 1024) {
          return NextResponse.json({ success: false, error: 'File size exceeds 50MB limit.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Check magic bytes
        if (!isZipFile(buffer)) {
          return NextResponse.json({ success: false, error: 'File is not a valid ZIP archive.' }, { status: 400 });
        }

        // File checks -> Uncompressed size & entries limit
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        if (entries.length > 10000) {
          return NextResponse.json({ success: false, error: 'ZIP file contains too many entries.' }, { status: 400 });
        }

        let totalUncompressedSize = 0;
        for (const entry of entries) {
          totalUncompressedSize += entry.header.size;
        }

        if (totalUncompressedSize > 500 * 1024 * 1024) {
          return NextResponse.json({ success: false, error: 'ZIP contents exceed uncompressed limits.' }, { status: 400 });
        }

        // Upload to Supabase Storage
        await uploadToStorage(storagePath, buffer, 'application/zip');

        // Log timeline event
        await supabase
          .from('timeline_events')
          .insert([
            {
              project_id: projectId,
              event_type: 'upload',
              event_message: 'Project uploaded via ZIP file'
            }
          ]);

        return NextResponse.json({
          success: true,
          projectId: projectId,
          storagePath: storagePath,
          type: 'zip_upload'
        });
      } else {
        return NextResponse.json({ success: false, error: 'No file or user story provided' }, { status: 400 });
      }
    } else {
      // Handle GitHub repository URL
      const body = await request.json();
      const { repoUrl, githubToken } = body;
      let { projectName } = body;

      if (!repoUrl) {
        return NextResponse.json({ success: false, error: 'No repository URL provided' }, { status: 400 });
      }

      // Sanitize project name
      projectName = (projectName || `GitHub Project ${new Date().toISOString()}`).substring(0, 100).replace(/[<>\:"\/\\|?*]/g, '');

      // Strictly validate URL pattern
      const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9._-]+)+\/?(\.git)?$/;
      if (!urlPattern.test(repoUrl)) {
        return NextResponse.json({ success: false, error: 'Invalid repository URL format' }, { status: 400 });
      }

      // Create project in Supabase first
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            name: projectName,
            user_id: userId,
            repo_url: repoUrl,
          }
        ])
        .select()
        .single();

      if (projectError || !project) {
        console.error('Error creating project:', projectError);
        return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
      }

      const projectId = project.id;
      const tmpDir = os.tmpdir();
      const cloneDir = path.join(tmpDir, `DevSentinel-${projectId}-${Date.now()}`);

      try {
        // SECURITY FIX: Command Injection Fix
        const gitArgs = ['clone', '--depth', '1'];
        
        let targetUrl = repoUrl;
        if (githubToken) {
           const urlObj = new URL(repoUrl);
           if (urlObj.hostname === 'github.com') {
             targetUrl = `https://${githubToken}@${urlObj.hostname}${urlObj.pathname}`;
           }
        }
        
        gitArgs.push(targetUrl);
        gitArgs.push(cloneDir);

        const env = { ...process.env };
        
        await execFileAsync('git', gitArgs, { 
          timeout: 60000,
          env 
        });

        // Create ZIP from cloned repository
        const zipBuffer = await zipDirectory(cloneDir);

        // Upload to Supabase Storage
        const storagePath = `projects/${projectId}/source.zip`;
        await uploadToStorage(storagePath, zipBuffer, 'application/zip');

        // Log timeline event
        await supabase
          .from('timeline_events')
          .insert([
            {
              project_id: projectId,
              event_type: 'upload',
              event_message: `Project cloned from ${sanitizeUrl(repoUrl)}`
            }
          ]);

        return NextResponse.json({
          success: true,
          projectId: projectId,
          storagePath: storagePath,
          type: 'github_repo'
        });
      } catch (cloneError: any) {
        // SECURITY FIX: GitHub Token Leak (credential stripping)
        const errorMessage = cloneError.message ? sanitizeUrl(cloneError.message) : 'Unknown error';
        console.error('Git clone error:', errorMessage);

        return NextResponse.json({
          success: false,
          error: `Failed to clone repository: ${errorMessage}`
        }, { status: 500 });
      } finally {
        // SECURITY FIX: Cleanup Fix implemented in finally block
        try {
          await fs.rm(cloneDir, { recursive: true, force: true });
        } catch { }
      }
    }
  } catch (error: any) {
    const errorMsg = error.message ? sanitizeUrl(error.message) : 'Internal server error';
    console.error('Upload error:', errorMsg);
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}
