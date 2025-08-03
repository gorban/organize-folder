import { Meta, StoryObj } from '@storybook/html';
import { SelectFolder } from '../src/renderer/components/select-folder';
import '../src/renderer/styles/main.css';
import '../src/renderer/styles/select-folder.css';

interface SelectFolderArgs {
  className: string;
  mockFolderPath: string;
  showMockResult: boolean;
}

// Mock the electronAPI for Storybook
const createMockElectronAPI = (folderPath: string, showResult: boolean) => {
  return {
    selectFolder: async () => {
      // Simulate folder selection
      await new Promise(resolve => setTimeout(resolve, 500));
      if (showResult) {
        return { canceled: false, filePaths: [folderPath] };
      } else {
        return { canceled: true };
      }
    },
    scanFolder: async () => {
      // Simulate folder scanning
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: 'Folder scanned successfully' };
    },
    getHierarchy: async () => {
      // Mock hierarchy data
      return {
        success: true,
        data: [
          { id: 1, name: 'Documents', path: `${folderPath}\\Documents`, parent_id: null, type: 'directory' as const, created_at: new Date().toISOString(), modified_at: new Date().toISOString() },
          { id: 2, name: 'file1.txt', path: `${folderPath}\\file1.txt`, parent_id: null, type: 'file' as const, size: 1024, created_at: new Date().toISOString(), modified_at: new Date().toISOString() },
          { id: 3, name: 'file2.txt', path: `${folderPath}\\Documents\\file2.txt`, parent_id: 1, type: 'file' as const, size: 2048, created_at: new Date().toISOString(), modified_at: new Date().toISOString() },
          { id: 4, name: 'Images', path: `${folderPath}\\Images`, parent_id: null, type: 'directory' as const, created_at: new Date().toISOString(), modified_at: new Date().toISOString() },
          { id: 5, name: 'photo.jpg', path: `${folderPath}\\Images\\photo.jpg`, parent_id: 4, type: 'file' as const, size: 512000, created_at: new Date().toISOString(), modified_at: new Date().toISOString() },
        ]
      };
    },
    getChildren: async () => {
      return { success: true, data: [] };
    }
  };
};

const meta: Meta<SelectFolderArgs> = {
  title: 'Components/SelectFolder', 
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component',
    },
    mockFolderPath: {
      control: 'text',
      description: 'Mock folder path for demonstration',
    },
    showMockResult: {
      control: 'boolean',
      description: 'Whether to show mock folder selection result',
    },
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.backgroundColor = '#fff';
    
    // Mock the electronAPI
    (window as any).electronAPI = createMockElectronAPI(args.mockFolderPath, args.showMockResult);
    
    const selectFolder = new SelectFolder({
      className: args.className,
      onFolderSelected: (folderPath: string) => {
        console.log('Folder selected:', folderPath);
        // You could add some visual feedback here in Storybook
        const statusDiv = container.querySelector('.storybook-status') as HTMLElement;
        if (statusDiv) {
          statusDiv.textContent = `✅ Folder selected: ${folderPath}`;
          statusDiv.style.color = 'green';
        }
      },
      onScanComplete: (success: boolean, message?: string) => {
        console.log('Scan complete:', success, message);
        const statusDiv = container.querySelector('.storybook-status') as HTMLElement;
        if (statusDiv) {
          statusDiv.textContent = success ? '✅ Scan completed successfully!' : `❌ Scan failed: ${message}`;
          statusDiv.style.color = success ? 'green' : 'red';
        }
      }
    });

    // Add a status div for Storybook feedback
    const statusDiv = document.createElement('div');
    statusDiv.className = 'storybook-status';
    statusDiv.style.marginTop = '20px';
    statusDiv.style.padding = '10px';
    statusDiv.style.fontFamily = 'monospace';
    statusDiv.style.fontSize = '14px';
    statusDiv.textContent = 'Click "Choose Folder" to see the component in action';
    
    selectFolder.render(container);
    container.appendChild(statusDiv);
    
    return container;
  },
};

export default meta;
type Story = StoryObj<SelectFolderArgs>;

export const Default: Story = {
  args: {
    className: '',
    mockFolderPath: 'C:\\Users\\Example\\MyFolder',
    showMockResult: true,
  },
};

export const CustomClass: Story = {
  args: {
    className: 'custom-select-folder',
    mockFolderPath: 'C:\\Projects\\OrganizeMe',
    showMockResult: true,
  },
};

export const CanceledSelection: Story = {
  args: {
    className: '',
    mockFolderPath: 'C:\\Users\\Example\\MyFolder',
    showMockResult: false,
  },
};

export const LongPath: Story = {
  args: {
    className: '',
    mockFolderPath: 'C:\\Users\\Example\\Very\\Long\\Folder\\Path\\With\\Many\\Subdirectories\\AndEvenMore\\Levels\\Deep',
    showMockResult: true,
  },
};