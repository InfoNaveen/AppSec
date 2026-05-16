import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { commitToGitHub, extractRepoInfo } from '@/lib/github';
import { scanRateLimit } from '@/lib/rate-limit'; // Using scan rate limit for commits (5/hr)

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX: CSRF Origin verification
    const origin = request.headers.get('origin');
    if (origin && origin !== process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ success: false, error: 'Forbidden. Invalid origin for CSRF.' }, { status: 403 });
    }

    const body = await request.json();
    const { projectId, githubToken, branchName = 'DevSentinel-fixes', commitMessage = 'Apply security fixes from DevSentinel AI', repoUrl } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
    }

    if (!githubToken) {
      return NextResponse.json({ success: false, error: 'GitHub token is required' }, { status: 400 });
    }

    if (!repoUrl) {
      return NextResponse.json({ success: false, error: 'Repository URL is required' }, { status: 400 });
    }

    // SECURITY FIX: Rate Limiting
    if (scanRateLimit) {
      // Using projectId as identfier since this route didn't query `user.id` originally
      const { success, reset } = await scanRateLimit.limit(`commit-${projectId}`);
      if (!success) {
        return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { 
          status: 429,
          headers: { 'Retry-After': Math.max(0, Math.ceil((reset - Date.now()) / 1000)).toString() }
        });
      }
    }

    const projectPath = path.join(process.cwd(), 'tmp', 'DevSentinel', projectId);

    // Extract repository info from URL
    const repoInfo = extractRepoInfo(repoUrl);
    if (!repoInfo) {
      return NextResponse.json({ success: false, error: 'Invalid repository URL' }, { status: 400 });
    }

    // Read all files in the project directory to commit
    const filesToCommit: Array<{ path: string; content: string }> = [];
    
    try {
      const getAllFiles = async (dir: string, basePath: string = '') => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(basePath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules and other common directories
            if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
              await getAllFiles(fullPath, relativePath);
            }
          } else {
            // Read file content
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              filesToCommit.push({
                path: relativePath.replace(/\\/g, '/'), // Normalize path separators
                content
              });
            } catch (readError) {
              // Skip binary files or files that can't be read
              console.warn(`Could not read file ${fullPath}:`, readError);
            }
          }
        }
      };
      
      await getAllFiles(projectPath);
    } catch (readError) {
      console.error('Error reading project files:', readError);
      return NextResponse.json({ success: false, error: 'Failed to read project files' }, { status: 500 });
    }

    // Commit files to GitHub
    try {
      const result = await commitToGitHub({
        token: githubToken,
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        branch: branchName,
        message: commitMessage,
        files: filesToCommit
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Changes committed successfully', 
        prUrl: result.prUrl
      });
    } catch (commitError) {
      console.error('Commit error:', commitError);
      return NextResponse.json({ success: false, error: `Failed to commit to GitHub: ${commitError instanceof Error ? commitError.message : 'Unknown error'}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Commit error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}