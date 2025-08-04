import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { DatabaseService } from './database';

class OrganizeFolderApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    // Add GPU-related command line switches for stability
    app.commandLine.appendSwitch('disable-gpu-sandbox');
    app.commandLine.appendSwitch('disable-software-rasterizer');
    app.commandLine.appendSwitch('disable-background-timer-throttling');
    app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    
    // Disable hardware acceleration to prevent GPU crashes
    // This prevents the crashes but window will still show
    app.disableHardwareAcceleration();
    
    // Handle child process crashes (replaces deprecated gpu-process-crashed)  
    app.on('child-process-gone', (_event, details) => {
      if (details.type === 'GPU' && this.mainWindow && !this.mainWindow.isDestroyed()) {
        // Silently reload window on GPU crash
        this.mainWindow.reload();
      }
    });

    // Handle renderer process crashes
    app.on('render-process-gone', (_event, webContents, _details) => {
      // Recreate window if main window crashed
      if (this.mainWindow && this.mainWindow.webContents === webContents) {
        this.mainWindow = null;
        this.createWindow();
      }
    });

    app.whenReady().then(() => {
      this.setupIpcHandlers();
      this.createWindow();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        // More stable rendering options
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        // GPU-related stability options
        offscreen: false,
        disableHtmlFullscreenWindowResize: true,
        // Force software rendering to avoid GPU issues
        enableWebSQL: false,
        // Additional stability options
        sandbox: false,
        spellcheck: false,
      },
      icon: path.join(__dirname, '../../assets/icon.png'),
      title: 'Organize Folder',
      minWidth: 800,
      minHeight: 600,
      // Anti-flashing options
      show: true, // Show immediately since we have stability switches
      backgroundColor: '#ffffff', // White background to prevent black flashing
      titleBarStyle: 'default',
    });

    // Add web contents crash handling
    this.mainWindow.webContents.on('crashed', (_event) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.reload();
      }
    });

    // Window is already shown immediately, just ensure it's focused when content loads
    this.mainWindow.webContents.once('did-finish-load', () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.focus();
      }
    });

    const isDev = process.env.NODE_ENV === 'development';
    
    // Load the HTML file
    const htmlPath = path.join(__dirname, '../index.html');
    this.mainWindow.loadFile(htmlPath).catch((error) => {
      console.error('Failed to load HTML file:', error);
      // Try alternative path if main path fails
      const altPath = path.join(__dirname, '../renderer/index.html');
      this.mainWindow?.loadFile(altPath).catch((altError) => {
        console.error('Failed to load alternative HTML file:', altError);
      });
    });

    if (isDev) {
      this.mainWindow.webContents.openDevTools();
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Prevent navigation to external URLs (security)
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.origin !== 'file://') {
        event.preventDefault();
      }
    });
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private setupIpcHandlers(): void {
    // Import required modules
    const { dialog } = require('electron');
    const { FileScanner } = require('./file-scanner');
    
    let fileScanner: any = null;
    
    // Initialize FileScanner with error handling
    try {
      fileScanner = new FileScanner();
      console.log('FileScanner initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FileScanner:', error);
    }

    // Handle folder selection dialog
    ipcMain.handle('dialog:selectFolder', async () => {
      if (!this.mainWindow) return { canceled: true };
      
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Folder to Organize'
      });
      
      return result;
    });

    // Handle folder scanning and database storage
    ipcMain.handle('files:scanFolder', async (event, folderPath: string) => {
      try {
        if (!fileScanner) {
          throw new Error('FileScanner not initialized');
        }
        
        // Set up progress callback to send updates to renderer
        const progressCallback = (folderCount: number, fileCount: number) => {
          event.sender.send('scan:progress', { folderCount, fileCount });
        };
        
        await fileScanner.scanFolder(folderPath, progressCallback);
        
        // Save app state on successful scan completion
        const db = DatabaseService.getInstance();
        db.saveAppState(folderPath, true);
        
        return { success: true, message: 'Folder scanned successfully' };
      } catch (error) {
        console.error('Error scanning folder:', error);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
      }
    });

    // Handle getting scanned hierarchy
    ipcMain.handle('files:getHierarchy', async () => {
      try {
        if (!fileScanner) {
          throw new Error('FileScanner not initialized');
        }
        const hierarchy = fileScanner.getScannedHierarchy();
        return { success: true, data: hierarchy };
      } catch (error) {
        console.error('Error getting hierarchy:', error);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
      }
    });

    // Handle getting children of a specific folder
    ipcMain.handle('files:getChildren', async (_event, parentId: number | null) => {
      try {
        if (!fileScanner) {
          throw new Error('FileScanner not initialized');
        }
        const children = fileScanner.getChildrenOf(parentId);
        return { success: true, data: children };
      } catch (error) {
        console.error('Error getting children:', error);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
      }
    });

    // Handle getting app state
    ipcMain.handle('app:getState', async () => {
      try {
        const db = DatabaseService.getInstance();
        const state = db.getAppState();
        return { success: true, data: state };
      } catch (error) {
        console.error('Error getting app state:', error);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
      }
    });

    // Handle clearing app state
    ipcMain.handle('app:clearState', async () => {
      try {
        const db = DatabaseService.getInstance();
        db.clearAppState();
        return { success: true, message: 'App state cleared successfully' };
      } catch (error) {
        console.error('Error clearing app state:', error);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
      }
    });
  }
}

new OrganizeFolderApp();
