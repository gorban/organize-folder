export interface SelectFolderOptions {
  className?: string;
  onFolderSelected?: (folderPath: string) => void;
  onScanComplete?: (success: boolean, message?: string) => void;
  onDebugDatabase?: () => void;
}

export interface FileSystemObject {
  id?: number;
  name: string;
  path: string;
  parent_id: number | null;
  type: 'file' | 'directory';
  size?: number;
  created_at: string;
  modified_at: string;
}

declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
      scanFolder: (folderPath: string) => Promise<{ success: boolean; message?: string }>;
      getHierarchy: () => Promise<{ success: boolean; data?: FileSystemObject[]; message?: string }>;
      getChildren: (parentId: number | null) => Promise<{ success: boolean; data?: FileSystemObject[]; message?: string }>;
    }
  }
}

export class SelectFolder {
  private element: HTMLElement;
  private selectedPath: string | null = null;
  private options: SelectFolderOptions;
  private isScanning: boolean = false;

  constructor(options: SelectFolderOptions = {}) {
    this.options = options;
    this.element = this.createElement();
    this.bindEvents();
  }

  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = `select-folder ${this.options.className || ''}`.trim();
    container.setAttribute('data-testid', 'select-folder');
    
    container.innerHTML = `
      <div class="select-folder-content">
        <h3 class="select-folder-title">Select Folder to Organize</h3>
        <button class="select-folder-button" data-testid="select-folder-button">
          Choose Folder
        </button>
        <div class="selected-path" data-testid="selected-path" style="display: none;">
          <strong>Selected:</strong> <span class="path-text"></span>
        </div>
        <div class="scan-status" data-testid="scan-status" style="display: none;">
          <span class="status-text"></span>
        </div>
        <div class="scan-progress" data-testid="scan-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <span class="progress-text">Scanning folder...</span>
        </div>
        <div class="folder-summary" data-testid="folder-summary" style="display: none;">
          <h4>Folder Summary</h4>
          <ul class="summary-list">
            <li>Total files: <span class="file-count">0</span></li>
            <li>Total directories: <span class="dir-count">0</span></li>
          </ul>
          <div class="debug-controls">
            <button class="debug-database-btn" data-testid="debug-database-btn">
              🔍 View Database
            </button>
          </div>
        </div>
      </div>
    `;
    
    return container;
  }

  private bindEvents(): void {
    const button = this.element.querySelector('.select-folder-button') as HTMLButtonElement;
    if (button) {
      button.addEventListener('click', () => this.selectFolder());
    }
    
    const debugButton = this.element.querySelector('.debug-database-btn') as HTMLButtonElement;
    if (debugButton) {
      debugButton.addEventListener('click', () => {
        this.options.onDebugDatabase?.();
      });
    }
  }

  private async selectFolder(): Promise<void> {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      const result = await window.electronAPI.selectFolder();
      
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        this.showStatus('Folder selection canceled', 'info');
        return;
      }

      const folderPath = result.filePaths[0];
      this.selectedPath = folderPath;
      
      this.showSelectedPath(folderPath);
      this.options.onFolderSelected?.(folderPath);
      
      // Start scanning the folder
      await this.scanFolder(folderPath);
      
    } catch (error) {
      console.error('Error selecting folder:', error);
      this.showStatus('Error selecting folder', 'error');
    }
  }

  private showSelectedPath(path: string): void {
    const pathElement = this.element.querySelector('.selected-path') as HTMLElement;
    const pathText = this.element.querySelector('.path-text') as HTMLElement;
    
    if (pathElement && pathText) {
      pathText.textContent = path;
      pathElement.style.display = 'block';
    }
  }

  private showStatus(message: string, type: 'info' | 'error' | 'success'): void {
    const statusElement = this.element.querySelector('.scan-status') as HTMLElement;
    const statusText = this.element.querySelector('.status-text') as HTMLElement;
    
    if (statusElement && statusText) {
      statusText.textContent = message;
      statusElement.className = `scan-status ${type}`;
      statusElement.style.display = 'block';
      
      // Hide after 5 seconds for non-error messages
      if (type !== 'error') {
        setTimeout(() => {
          statusElement.style.display = 'none';
        }, 5000);
      }
    }
  }

  private showProgress(show: boolean): void {
    const progressElement = this.element.querySelector('.scan-progress') as HTMLElement;
    if (progressElement) {
      progressElement.style.display = show ? 'block' : 'none';
    }
  }

  private async scanFolder(folderPath: string): Promise<void> {
    if (this.isScanning) return;
    
    this.isScanning = true;
    this.showProgress(true);
    this.showStatus('Scanning folder...', 'info');
    
    try {
      const result = await window.electronAPI.scanFolder(folderPath);
      
      if (result.success) {
        this.showStatus('Folder scanned successfully!', 'success');
        this.options.onScanComplete?.(true);
        
        // Load and display summary
        await this.loadFolderSummary();
      } else {
        this.showStatus(result.message || 'Error scanning folder', 'error');
        this.options.onScanComplete?.(false, result.message);
      }
    } catch (error) {
      console.error('Error scanning folder:', error);
      this.showStatus('Error scanning folder', 'error');
      this.options.onScanComplete?.(false, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isScanning = false;
      this.showProgress(false);
    }
  }

  private async loadFolderSummary(): Promise<void> {
    try {
      const result = await window.electronAPI.getHierarchy();
      
      if (result.success && result.data) {
        const files = result.data.filter(item => item.type === 'file');
        const directories = result.data.filter(item => item.type === 'directory');
        
        this.showFolderSummary(files.length, directories.length);
      }
    } catch (error) {
      console.error('Error loading folder summary:', error);
    }
  }

  private showFolderSummary(fileCount: number, dirCount: number): void {
    const summaryElement = this.element.querySelector('.folder-summary') as HTMLElement;
    const fileCountElement = this.element.querySelector('.file-count') as HTMLElement;
    const dirCountElement = this.element.querySelector('.dir-count') as HTMLElement;
    
    if (summaryElement && fileCountElement && dirCountElement) {
      fileCountElement.textContent = fileCount.toString();
      dirCountElement.textContent = dirCount.toString();
      summaryElement.style.display = 'block';
    }
  }

  public render(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  public getSelectedPath(): string | null {
    return this.selectedPath;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  public reset(): void {
    this.selectedPath = null;
    
    // Hide all status elements
    const elements = ['.selected-path', '.scan-status', '.scan-progress', '.folder-summary'];
    elements.forEach(selector => {
      const element = this.element.querySelector(selector) as HTMLElement;
      if (element) {
        element.style.display = 'none';
      }
    });
  }
}