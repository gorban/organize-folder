# SQLite Database Debugging Guide

## Built-in Database Viewer (Recommended) ✅

The app now includes a built-in database viewer that shows real-time database contents.

### How to Use:
1. Run `npm run dev`
2. Click "Choose Folder" and select a folder
3. After scanning completes, click the **🔍 View Database** button
4. A modal will open showing all database contents in a table format

### Features:
- **Real-time data** - Shows current database state
- **Sortable table** - Directories first, then alphabetical
- **File stats** - Total files, directories, and objects
- **Size formatting** - Human-readable file sizes (KB, MB, etc)
- **Path truncation** - Long paths are abbreviated but show full path on hover
- **Refresh button** - Update data without closing the viewer
- **Responsive design** - Works on all screen sizes

## Alternative Methods

### Method 1: Console Logging
Add temporary logging to see what's being stored:

```typescript
// In src/main/database.ts, add console.log to insertFileSystemObject
public insertFileSystemObject(obj: FileSystemObject): number {
  console.log('Inserting:', obj);
  const stmt = this.db.prepare(`...`);
  const result = stmt.run(...);
  console.log('Inserted with ID:', result.lastInsertRowid);
  return result.lastInsertRowid as number;
}
```

### Method 2: External SQLite Browser
1. Install [DB Browser for SQLite](https://sqlitebrowser.org/)
2. The database file is located at: `C:\Users\bruck\source\repos\organize-folder\data\organize-folder.db`
3. Open the file in DB Browser while the app is **not running**
4. Browse the `file_objects` table

### Method 3: Command Line sqlite3
```bash
# Install sqlite3 (if not already installed)
# Navigate to project directory
cd "C:\Users\bruck\source\repos\organize-folder"

# Open the database
sqlite3 data/organize-folder.db

# View table structure
.schema file_objects

# View all data
SELECT * FROM file_objects ORDER BY type DESC, name ASC;

# Count files and directories
SELECT type, COUNT(*) as count FROM file_objects GROUP BY type;

# View hierarchy (with parent relationships)
SELECT 
  f.id,
  f.name,
  f.type,
  f.parent_id,
  p.name as parent_name
FROM file_objects f
LEFT JOIN file_objects p ON f.parent_id = p.id
ORDER BY f.type DESC, f.name ASC;

# Exit
.quit
```

### Method 4: Developer Tools Console
When the app is running, open DevTools (F12) and use the console:

```javascript
// Check if electronAPI is available
console.log(window.electronAPI);

// Manually call the database functions
window.electronAPI.getHierarchy().then(result => {
  console.log('Database contents:', result);
});

window.electronAPI.getChildren(null).then(result => {
  console.log('Root level items:', result);
});
```

## Database Schema

The `file_objects` table structure:

```sql
CREATE TABLE file_objects (
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
```

## Troubleshooting

### Database Not Found
If you get "database not found" errors:
1. Make sure you've run `npm run dev` and selected a folder
2. Check if the `data` directory exists in your project root
3. The database is created automatically when first accessed

### Empty Database
If the database exists but has no data:
1. Make sure the folder scan completed successfully
2. Check the console for any scanning errors
3. Try selecting a folder with actual files and subdirectories

### Permission Errors
If you can't access the database file:
1. Make sure the Electron app is closed before using external tools
2. Check that you have read/write permissions to the project directory
3. Try running as administrator if needed

## Development Tips

### Clearing Database
To start fresh, simply delete the database file:
```bash
rm data/organize-folder.db
# or on Windows:
del data\organize-folder.db
```

### Backing Up Database
```bash
cp data/organize-folder.db data/organize-folder-backup.db
```

### Testing Different Folder Structures
1. Create test folders with various file types
2. Use the built-in viewer to see how the hierarchy is stored
3. Test edge cases (empty folders, very long paths, special characters)

## Performance Monitoring

Large folders can result in many database operations. Monitor performance:

```javascript
// In DevTools console, time database operations
console.time('getHierarchy');
window.electronAPI.getHierarchy().then(result => {
  console.timeEnd('getHierarchy');
  console.log(`Loaded ${result.data?.length || 0} items`);
});
```

The built-in viewer is the easiest way to debug database contents during development! 🔍
