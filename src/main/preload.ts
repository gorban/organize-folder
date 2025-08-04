import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  scanFolder: (folderPath: string) => ipcRenderer.invoke('files:scanFolder', folderPath),
  getHierarchy: () => ipcRenderer.invoke('files:getHierarchy'),
  getChildren: (parentId: number | null) => ipcRenderer.invoke('files:getChildren', parentId),
  organizeFiles: (options: any) => ipcRenderer.invoke('files:organize', options),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Progress event listeners
  onScanProgress: (callback: (folderCount: number, fileCount: number) => void) => {
    ipcRenderer.on('scan:progress', (_event, data) => callback(data.folderCount, data.fileCount));
  },
  removeScanProgressListener: () => {
    ipcRenderer.removeAllListeners('scan:progress');
  },
  
  // App state management
  getAppState: () => ipcRenderer.invoke('app:getState'),
  clearAppState: () => ipcRenderer.invoke('app:clearState')
});
