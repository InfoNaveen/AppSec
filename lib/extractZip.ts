import AdmZip from 'adm-zip';
import path from 'path';
import { promises as fs } from 'fs';

export default async function extractZip(zipPath: string, extractTo: string): Promise<void> {
  try {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    // Validate target destination absolutely
    const resolvedExtractTo = path.resolve(extractTo);

    // Create all directories first
    for (const entry of zipEntries) {
      // SECURITY FIX: Zip slip Validation
      // Strip any leading slashes
      const cleanEntryName = entry.entryName.replace(/^[/\\]+/, '');
      const entryPath = path.resolve(resolvedExtractTo, cleanEntryName);
      
      if (!entryPath.startsWith(resolvedExtractTo + path.sep) && entryPath !== resolvedExtractTo) {
        throw new Error('Zip slip detected');
      }
      
      if (entry.isDirectory) {
        try {
          await fs.access(entryPath);
        } catch {
          await fs.mkdir(entryPath, { recursive: true });
        }
      }
    }
    
    // Extract all files
    for (const entry of zipEntries) {
      const cleanEntryName = entry.entryName.replace(/^[/\\]+/, '');
      const entryPath = path.resolve(resolvedExtractTo, cleanEntryName);
      
      // SECURITY FIX: Zip slip Validation
      if (!entryPath.startsWith(resolvedExtractTo + path.sep) && entryPath !== resolvedExtractTo) {
        throw new Error('Zip slip detected');
      }
      
      if (!entry.isDirectory) {
        // Ensure parent directory exists
        const dirPath = path.dirname(entryPath);
        try {
          await fs.access(dirPath);
        } catch {
          await fs.mkdir(dirPath, { recursive: true });
        }
        
        // Write file
        await fs.writeFile(entryPath, entry.getData());
      }
    }
  } catch (error) {
    console.error('ZIP extraction error:', error);
    throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : String(error)}`);
  }
}