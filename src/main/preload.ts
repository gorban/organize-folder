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
});