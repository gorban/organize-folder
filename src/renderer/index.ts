import { Banner } from './components/banner';
import { SelectFolder } from './components/select-folder';
import { DatabaseViewer } from './components/database-viewer';

class App {
  private banner: Banner;
  private selectFolder: SelectFolder;
  private databaseViewer: DatabaseViewer;

  constructor() {
    this.banner = new Banner({ title: 'Organize Folder' });
    this.databaseViewer = new DatabaseViewer();
    this.selectFolder = new SelectFolder({
      onFolderSelected: this.handleFolderSelected.bind(this),
      onScanComplete: this.handleScanComplete.bind(this),
      onDebugDatabase: this.handleDebugDatabase.bind(this)
    });
    this.init();
  }

  private init(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      this.setupApp();
    }
  }

  private setupApp(): void {
    this.renderBanner();
    this.renderSelectFolder();
    this.renderDatabaseViewer();
    this.setupEventListeners();
  }

  private renderBanner(): void {
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer && bannerContainer.children.length === 0) {
      this.banner.render(bannerContainer);
    }
  }

  private renderSelectFolder(): void {
    const selectFolderContainer = document.getElementById('select-folder-container');
    if (selectFolderContainer && selectFolderContainer.children.length === 0) {
      this.selectFolder.render(selectFolderContainer);
    }
  }

  private renderDatabaseViewer(): void {
    // Render the database viewer directly to body (it's a modal/overlay)
    this.databaseViewer.render(document.body);
  }

  private setupEventListeners(): void {
    const selectFolderBtn = document.getElementById('select-folder-btn');
    if (selectFolderBtn) {
      selectFolderBtn.addEventListener('click', this.handleSelectFolder.bind(this));
    }
    
    // Add keyboard shortcuts for debugging
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+D to toggle database viewer
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.databaseViewer.toggle();
      }
    });
  }

  private async handleSelectFolder(): Promise<void> {
    try {
      // This functionality is now handled by the SelectFolder component
      console.log('Select folder clicked - handled by SelectFolder component');
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  }

  private handleFolderSelected(folderPath: string): void {
    console.log('Folder selected:', folderPath);
    // Additional logic can be added here if needed
  }

  private handleScanComplete(success: boolean, message?: string): void {
    console.log('Scan complete:', success, message);
    // Additional logic can be added here if needed
  }

  private handleDebugDatabase(): void {
    console.log('Opening database viewer');
    this.databaseViewer.show();
  }
}

// Initialize the app (singleton pattern to prevent multiple instances)
let appInstance: App | null = null;

if (!appInstance) {
  appInstance = new App();
}