import { Meta, StoryObj } from '@storybook/html';
import { DatabaseViewer, DatabaseViewerOptions, FileSystemObject } from '../src/renderer/components/database-viewer';
import '../src/renderer/styles/database-viewer.css';
import '../src/renderer/styles/main.css';

interface DatabaseViewerArgs extends DatabaseViewerOptions {
  mockData: 'empty' | 'small' | 'large';
  isVisible: boolean;
}

// Mock data for different scenarios
const createMockData = (type: 'empty' | 'small' | 'large'): FileSystemObject[] => {
  if (type === 'empty') return [];
  
  if (type === 'small') {
    return [
      {
        id: 1,
        name: 'Documents',
        path: 'C:\\Users\\User\\Documents',
        parent_id: null,
        type: 'directory',
        created_at: '2024-01-01T10:00:00Z',
        modified_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 2,
        name: 'report.pdf',
        path: 'C:\\Users\\User\\Documents\\report.pdf',
        parent_id: 1,
        type: 'file',
        size: 1024768,
        created_at: '2024-01-01T10:30:00Z',
        modified_at: '2024-01-01T10:30:00Z'
      },
      {
        id: 3,
        name: 'Notes',
        path: 'C:\\Users\\User\\Documents\\Notes',
        parent_id: 1,
        type: 'directory',
        created_at: '2024-01-01T11:00:00Z',
        modified_at: '2024-01-01T11:00:00Z'
      },
      {
        id: 4,
        name: 'todo.txt',
        path: 'C:\\Users\\User\\Documents\\Notes\\todo.txt',
        parent_id: 3,
        type: 'file',
        size: 512,
        created_at: '2024-01-01T11:15:00Z',
        modified_at: '2024-01-01T12:00:00Z'
      }
    ];
  }
  
  // Large dataset
  const largeData: FileSystemObject[] = [];
  let id = 1;
  
  // Create root directories
  const rootDirs = ['Documents', 'Pictures', 'Music', 'Videos', 'Downloads'];
  rootDirs.forEach(dirName => {
    largeData.push({
      id: id++,
      name: dirName,
      path: `C:\\Users\\User\\${dirName}`,
      parent_id: null,
      type: 'directory',
      created_at: '2024-01-01T10:00:00Z',
      modified_at: '2024-01-01T10:00:00Z'
    });
  });
  
  // Add files to each directory
  const fileTypes = [
    { ext: 'pdf', size: 1024768 },
    { ext: 'txt', size: 512 },
    { ext: 'jpg', size: 2097152 },
    { ext: 'mp3', size: 5242880 },
    { ext: 'mp4', size: 104857600 },
    { ext: 'docx', size: 262144 },
    { ext: 'xlsx', size: 524288 }
  ];
  
  largeData.slice(0, 5).forEach((dir, dirIndex) => {
    // Add 3-5 files per directory
    const fileCount = 3 + dirIndex;
    for (let i = 0; i < fileCount; i++) {
      const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      largeData.push({
        id: id++,
        name: `file_${i + 1}.${fileType.ext}`,
        path: `${dir.path}\\file_${i + 1}.${fileType.ext}`,
        parent_id: dir.id!,
        type: 'file',
        size: fileType.size + Math.floor(Math.random() * 1000),
        created_at: '2024-01-01T10:30:00Z',
        modified_at: '2024-01-01T10:30:00Z'
      });
    }
    
    // Add a subdirectory with more files
    if (dirIndex < 3) {
      const subDir = {
        id: id++,
        name: 'Subfolder',
        path: `${dir.path}\\Subfolder`,
        parent_id: dir.id!,
        type: 'directory' as const,
        created_at: '2024-01-01T11:00:00Z',
        modified_at: '2024-01-01T11:00:00Z'
      };
      largeData.push(subDir);
      
      // Add files to subdirectory
      for (let i = 0; i < 2; i++) {
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        largeData.push({
          id: id++,
          name: `sub_file_${i + 1}.${fileType.ext}`,
          path: `${subDir.path}\\sub_file_${i + 1}.${fileType.ext}`,
          parent_id: subDir.id!,
          type: 'file',
          size: fileType.size + Math.floor(Math.random() * 1000),
          created_at: '2024-01-01T11:30:00Z',
          modified_at: '2024-01-01T11:30:00Z'
        });
      }
    }
  });
  
  return largeData;
};

const meta: Meta<DatabaseViewerArgs> = {
  title: 'Components/DatabaseViewer',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the database viewer',
    },
    mockData: {
      control: { type: 'select' },
      options: ['empty', 'small', 'large'],
      description: 'Type of mock data to display',
    },
    isVisible: {
      control: 'boolean',
      description: 'Whether the database viewer is visible by default',
    },
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.minHeight = '100vh';
    container.style.background = '#f0f0f0';
    
    // Add some background content to show the overlay effect
    const backgroundContent = document.createElement('div');
    backgroundContent.style.padding = '20px';
    backgroundContent.innerHTML = `
      <h1>Organize Folder App</h1>
      <p>This is the background content. The database viewer appears as an overlay.</p>
      <button onclick="viewer.show()" style="padding: 10px 20px; margin: 10px;">Show Database Viewer</button>
      <button onclick="viewer.hide()" style="padding: 10px 20px; margin: 10px;">Hide Database Viewer</button>
      <button onclick="viewer.toggle()" style="padding: 10px 20px; margin: 10px;">Toggle Database Viewer</button>
    `;
    container.appendChild(backgroundContent);
    
    // Create the database viewer
    const viewer = new DatabaseViewer({
      className: args.className,
    });
    
    // Mock the electron API for Storybook
    (window as any).electronAPI = {
      getHierarchy: async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const data = createMockData(args.mockData);
        return {
          success: true,
          data: data
        };
      }
    };
    
    viewer.render(container);
    
    // Make viewer globally accessible for button controls
    (window as any).viewer = viewer;
    
    // Show viewer if isVisible is true
    if (args.isVisible) {
      setTimeout(() => viewer.show(), 100);
    }
    
    return container;
  },
};

export default meta;
type Story = StoryObj<DatabaseViewerArgs>;

export const Default: Story = {
  args: {
    className: '',
    mockData: 'small',
    isVisible: false,
  },
};

export const Empty: Story = {
  args: {
    className: '',
    mockData: 'empty',
    isVisible: true,
  },
};

export const SmallDataset: Story = {
  args: {
    className: '',
    mockData: 'small',
    isVisible: true,
  },
};

export const LargeDataset: Story = {
  args: {
    className: '',
    mockData: 'large',
    isVisible: true,
  },
};

export const WithCustomClass: Story = {
  args: {
    className: 'custom-database-viewer',
    mockData: 'small',
    isVisible: true,
  },
};

export const InteractiveDemo: Story = {
  args: {
    className: '',
    mockData: 'small',
    isVisible: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates the interactive features of the database viewer. Use the buttons to show/hide the viewer and the refresh button to reload data.',
      },
    },
  },
};
