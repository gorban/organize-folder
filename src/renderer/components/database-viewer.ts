export interface DatabaseViewerOptions {
  className?: string;
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

export class DatabaseViewer {
  private element: HTMLElement;
  private options: DatabaseViewerOptions;
  private isVisible: boolean = false;

  constructor(options: DatabaseViewerOptions = {}) {
    this.options = options;
    this.element = this.createElement();
    this.bindEvents();
  }

  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = `database-viewer ${this.options.className || ''}`.trim();
    container.setAttribute('data-testid', 'database-viewer');
    container.style.display = 'none';
    
    container.innerHTML = `
      <div class="database-viewer-content">
        <div class="database-viewer-header">
          <h3>Database Contents</h3>
          <div class="database-viewer-controls">
            <button class="refresh-btn" data-testid="refresh-database">Refresh</button>
            <button class="close-btn" data-testid="close-database-viewer">×</button>
          </div>
        </div>
        <div class="database-viewer-body">
          <div class="database-stats">
            <span class="stat-item">Files: <span class="file-count">0</span></span>
            <span class="stat-item">Directories: <span class="dir-count">0</span></span>
            <span class="stat-item">Total: <span class="total-count">0</span></span>
          </div>
          <div class="database-table-container">
            <table class="database-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Parent ID</th>
                  <th>Size</th>
                  <th>Path</th>
                </tr>
              </thead>
              <tbody class="database-table-body">
                <tr><td colspan="6">No data loaded</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    return container;
  }

  private bindEvents(): void {
    const refreshBtn = this.element.querySelector('.refresh-btn') as HTMLButtonElement;
    const closeBtn = this.element.querySelector('.close-btn') as HTMLButtonElement;
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadData());
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  public async loadData(): Promise<void> {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      const result = await window.electronAPI.getHierarchy();
      
      if (result.success && result.data) {
        this.renderData(result.data);
      } else {
        this.showError(result.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error loading database data:', error);
      this.showError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private renderData(data: FileSystemObject[]): void {
    const tableBody = this.element.querySelector('.database-table-body') as HTMLTableSectionElement;
    const fileCountEl = this.element.querySelector('.file-count') as HTMLElement;
    const dirCountEl = this.element.querySelector('.dir-count') as HTMLElement;
    const totalCountEl = this.element.querySelector('.total-count') as HTMLElement;
    
    if (!tableBody || !fileCountEl || !dirCountEl || !totalCountEl) return;

    // Update stats
    const files = data.filter(item => item.type === 'file');
    const directories = data.filter(item => item.type === 'directory');
    
    fileCountEl.textContent = files.length.toString();
    dirCountEl.textContent = directories.length.toString();
    totalCountEl.textContent = data.length.toString();

    // Clear and populate table
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6" style="text-align: center; color: #666;">No data in database</td>';
      tableBody.appendChild(row);
      return;
    }

    // Sort data: directories first, then by name
    const sortedData = [...data].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    sortedData.forEach(item => {
      const row = document.createElement('tr');
      row.className = `row-${item.type}`;
      
      const sizeText = item.size !== undefined ? this.formatSize(item.size) : '-';
      const pathText = item.path.length > 50 ? '...' + item.path.slice(-50) : item.path;
      
      row.innerHTML = `
        <td>${item.id || '-'}</td>
        <td class="name-cell">
          <span class="type-icon">${item.type === 'directory' ? '📁' : '📄'}</span>
          ${this.escapeHtml(item.name)}
        </td>
        <td class="type-cell">${item.type}</td>
        <td>${item.parent_id || '-'}</td>
        <td class="size-cell">${sizeText}</td>
        <td class="path-cell" title="${this.escapeHtml(item.path)}">${this.escapeHtml(pathText)}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }

  private showError(message: string): void {
    const tableBody = this.element.querySelector('.database-table-body') as HTMLTableSectionElement;
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Error: ${this.escapeHtml(message)}</td></tr>`;
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public show(): void {
    this.isVisible = true;
    this.element.style.display = 'block';
    this.loadData();
  }

  public hide(): void {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public render(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}