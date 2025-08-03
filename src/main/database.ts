import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface FileSystemObject {
  id?: number;
  name: string;
  path: string;
  parent_id: number | null;
  type: 'file' | 'directory';
  size?: number | undefined;
  created_at: string;
  modified_at: string;
}

export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor() {
    try {
      // Create database directory if it doesn't exist
      const dbDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const dbPath = path.join(dbDir, 'organize-folder.db');
      this.db = new Database(dbPath);
      this.initializeTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initializeTables(): void {
    // Create file_objects table for hierarchical file system storage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS file_objects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        parent_id INTEGER,
        type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
        size INTEGER,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES file_objects (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_file_objects_parent_id ON file_objects (parent_id);
      CREATE INDEX IF NOT EXISTS idx_file_objects_path ON file_objects (path);
      CREATE INDEX IF NOT EXISTS idx_file_objects_type ON file_objects (type);
    `);
  }

  public insertFileSystemObject(obj: FileSystemObject): number {
    const stmt = this.db.prepare(`
      INSERT INTO file_objects (name, path, parent_id, type, size, created_at, modified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      obj.name,
      obj.path,
      obj.parent_id,
      obj.type,
      obj.size || null,
      obj.created_at,
      obj.modified_at
    );
    
    return result.lastInsertRowid as number;
  }

  public getFileSystemObjectsByParent(parentId: number | null): FileSystemObject[] {
    const stmt = this.db.prepare(`
      SELECT * FROM file_objects 
      WHERE parent_id ${parentId === null ? 'IS NULL' : '= ?'}
      ORDER BY type DESC, name ASC
    `);
    
    const params = parentId === null ? [] : [parentId];
    return stmt.all(...params) as FileSystemObject[];
  }

  public getFileSystemObjectByPath(path: string): FileSystemObject | undefined {
    const stmt = this.db.prepare('SELECT * FROM file_objects WHERE path = ?');
    return stmt.get(path) as FileSystemObject | undefined;
  }

  public clearFileSystemObjects(): void {
    this.db.exec('DELETE FROM file_objects');
  }

  public getFullHierarchy(): FileSystemObject[] {
    const stmt = this.db.prepare(`
      WITH RECURSIVE hierarchy AS (
        SELECT id, name, path, parent_id, type, size, created_at, modified_at, 0 as level
        FROM file_objects
        WHERE parent_id IS NULL
        
        UNION ALL
        
        SELECT f.id, f.name, f.path, f.parent_id, f.type, f.size, f.created_at, f.modified_at, h.level + 1
        FROM file_objects f
        INNER JOIN hierarchy h ON f.parent_id = h.id
      )
      SELECT * FROM hierarchy ORDER BY level, type DESC, name ASC
    `);
    
    return stmt.all() as FileSystemObject[];
  }

  public close(): void {
    this.db.close();
  }
}
