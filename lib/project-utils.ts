import { promises as fs } from 'fs';
import path from 'path';
import extractZip from './extractZip';
import { downloadFromStorage } from './storage-utils';

/**
 * Prepare project directory from Supabase Storage
 */
export async function prepareProjectFromStorage(
  projectId: string,
  storagePath: string
): Promise<string> {
  // Use os.tmpdir() for cross-platform compatibility
  const tmpDir = require('os').tmpdir();
  const projectDir = path.join(tmpDir, `DevSentinel-${projectId}-${Date.now()}`);

  try {
    // Create project directory
    await fs.mkdir(projectDir, { recursive: true });

    // Download from storage
    const zipBuffer = await downloadFromStorage(storagePath);

    // Save zip temporarily
    const zipPath = path.join(projectDir, 'source.zip');
    await fs.writeFile(zipPath, zipBuffer);

    // Extract zip
    await extractZip(zipPath, projectDir);

    // Remove zip file
    await fs.unlink(zipPath);

    return projectDir;
  } catch (error) {
    // Clean up on error
    try {
      await fs.rm(projectDir, { recursive: true, force: true });
    } catch { }
    throw error;
  }
}

/**
 * Clean up project directory
 */
export async function cleanupProjectDir(projectDir: string): Promise<void> {
  try {
    await fs.rm(projectDir, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to clean up project directory:', error);
  }
}

