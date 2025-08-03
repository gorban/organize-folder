import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService, FileSystemObject } from './database';

export class FileScanner {
  private db: DatabaseService;
  private folderCount: number = 0;
  private fileCount: number = 0;
  private progressCallback: ((folderCount: number, fileCount: number) => void) | undefined;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async scanFolder(folderPath: string, progressCallback?: (folderCount: number, fileCount: number) => void): Promise<void> {
    try {
      // Clear existing data before scanning new folder
      this.db.clearFileSystemObjects();
      
      // Reset counters and set progress callback
      this.folderCount = 0;
      this.fileCount = 0;
      this.progressCallback = progressCallback;
      
      // Start scanning from the root folder
      await this.scanRecursive(folderPath, null);
    } catch (error) {
      console.error('Error scanning folder:', error);
      throw error;
    }
  }

  private async scanRecursive(currentPath: string, parentId: number | null): Promise<number> {
    try {
      const stats = await fs.promises.stat(currentPath);
      const name = path.basename(currentPath);
      
      // Create file system object
      const fileObj: FileSystemObject = {
        name: name || path.parse(currentPath).root, // Handle root paths
        path: currentPath,
        parent_id: parentId,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.isFile() ? stats.size : undefined,
        created_at: stats.birthtime.toISOString(),
        modified_at: stats.mtime.toISOString()
      };

      // Insert into database and get the ID
      const objectId = this.db.insertFileSystemObject(fileObj);

      // Update counters and emit progress
      if (stats.isDirectory()) {
        this.folderCount++;
      } else {
        this.fileCount++;
      }
      
      // Call progress callback if provided
      this.progressCallback?.(this.folderCount, this.fileCount);

      // If it's a directory, scan its contents
      if (stats.isDirectory()) {
        try {
          const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
          
          // Process directories first, then files
          const directories = entries.filter(entry => entry.isDirectory());
          const files = entries.filter(entry => entry.isFile());
          
          // Scan all subdirectories
          for (const dir of directories) {
            const dirPath = path.join(currentPath, dir.name);
            await this.scanRecursive(dirPath, objectId);
          }
          
          // Scan all files
          for (const file of files) {
            const filePath = path.join(currentPath, file.name);
            await this.scanRecursive(filePath, objectId);
          }
        } catch (readError) {
          // Handle permission errors or other read errors
          console.warn(`Could not read directory contents: ${currentPath}`, readError);
        }
      }

      return objectId;
    } catch (error) {
      console.error(`Error scanning path ${currentPath}:`, error);
      throw error;
    }
  }

  public getScannedHierarchy(): FileSystemObject[] {
    return this.db.getFullHierarchy();
  }

  public getChildrenOf(parentId: number | null): FileSystemObject[] {
    return this.db.getFileSystemObjectsByParent(parentId);
  }

  public findByPath(searchPath: string): FileSystemObject | undefined {
    return this.db.getFileSystemObjectByPath(searchPath);
  }
}
