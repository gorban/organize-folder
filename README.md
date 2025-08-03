# Organize Folder

A file organization tool built with Electron, TypeScript, HTML, CSS, and SQLite.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Development
```bash
# Start the app (requires prior build)
npm start

# Run in development mode (builds and starts Electron app)
npm run dev

# Run with hot reload and watch mode
npm run dev:watch

# Build the application
npm run build

# Run tests
npm test

# Run Storybook for component development
npm run storybook
```

**Note:** 
- First time: Run `npm run dev` to build and start the app
- After building: You can use `npm start` for faster startup
- The terminal will appear to "hang" when the app runs - this is normal. Close the Electron window to return to the terminal.

### Building for Production
```bash
# Build and package as executable
npm run dist

# Just package (after build)
npm run package
```

## Features
- Modern Electron application with TypeScript
- Component-based architecture with Storybook
- Automated testing with Playwright
- Cross-platform executable generation

## Development Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run test` - Run Playwright tests
- `npm run storybook` - Start Storybook component library
- `npm run dist` - Build and create distribution executable

## Working with Claude Code (Serena)

This project includes a comprehensive task completion checklist stored in Serena's memory system. When working with Claude Code:

### Accessing the Task Checklist
To retrieve the current task completion checklist:
```
Ask Serena to read memory: task_completion_checklist
```

### Updating Completed Items
When you complete development tasks, update the checklist memory:
```
Ask Serena to write memory with updated checklist marking completed items
```

### Key Checklist Areas
The checklist covers:
- Code quality and testing requirements
- TypeScript and Electron-specific standards
- Windows development considerations
- Database operation safety
- Git workflow guidelines
- Available development tools

This ensures consistent development practices and helps track progress on complex tasks.
