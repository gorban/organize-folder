import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

test.describe('App State Persistence', () => {
  const testDbPath = path.join(__dirname, '../data/test-organize-folder.db');
  
  test.beforeEach(async () => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Ensure data directory exists
    const dataDir = path.dirname(testDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  });

  test.afterEach(async () => {
    // Clean up test database after each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should have app state management API methods available', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Check that state management methods are available
    const apiCheck = await window.evaluate(async () => {
      const api = (window as any).electronAPI;
      return {
        hasGetState: typeof api.getAppState === 'function',
        hasClearState: typeof api.clearAppState === 'function',
        hasOnScanProgress: typeof api.onScanProgress === 'function',
        hasRemoveScanProgressListener: typeof api.removeScanProgressListener === 'function'
      };
    });

    expect(apiCheck.hasGetState).toBe(true);
    expect(apiCheck.hasClearState).toBe(true);
    expect(apiCheck.hasOnScanProgress).toBe(true);
    expect(apiCheck.hasRemoveScanProgressListener).toBe(true);

    await electronApp.close();
  });

  test('should return null state on fresh app startup', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Check initial state should be null
    const initialState = await window.evaluate(async () => {
      const api = (window as any).electronAPI;
      const result = await api.getAppState();
      return {
        success: result.success,
        hasData: result.data !== null,
        data: result.data
      };
    });

    expect(initialState.success).toBe(true);
    expect(initialState.hasData).toBe(false);
    expect(initialState.data).toBeNull();

    await electronApp.close();
  });

  test('should successfully clear app state', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Test clearing state (should work even if no state exists)
    const clearResult = await window.evaluate(async () => {
      const api = (window as any).electronAPI;
      const result = await api.clearAppState();
      return {
        success: result.success,
        message: result.message
      };
    });

    expect(clearResult.success).toBe(true);
    expect(clearResult.message).toBe('App state cleared successfully');

    await electronApp.close();
  });

  test('should handle state operations during component lifecycle', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Wait for component initialization
    await window.waitForTimeout(500);

    // Check that SelectFolder component is properly initialized
    const selectFolderComponent = window.locator('[data-testid="select-folder"]');
    await expect(selectFolderComponent).toBeVisible();

    const selectFolderBtn = window.locator('[data-testid="select-folder-button"]');
    await expect(selectFolderBtn).toBeVisible();
    await expect(selectFolderBtn).toHaveText('Choose Folder');

    // Verify state operations don't break component functionality
    const componentState = await window.evaluate(async () => {
      const api = (window as any).electronAPI;
      
      // Check state
      const getStateResult = await api.getAppState();
      
      // Clear state 
      const clearStateResult = await api.clearAppState();
      
      return {
        getStateSuccess: getStateResult.success,
        clearStateSuccess: clearStateResult.success,
        buttonStillVisible: document.querySelector('[data-testid="select-folder-button"]') !== null
      };
    });

    expect(componentState.getStateSuccess).toBe(true);
    expect(componentState.clearStateSuccess).toBe(true);
    expect(componentState.buttonStillVisible).toBe(true);

    // Button should still be functional after state operations
    await expect(selectFolderBtn).toBeEnabled();

    await electronApp.close();
  });

  test('should maintain component functionality across app restarts', async () => {
    // First app instance
    const electronApp1 = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window1 = await electronApp1.firstWindow();
    await window1.waitForLoadState('domcontentloaded');

    // Verify initial functionality
    const selectFolderBtn1 = window1.locator('[data-testid="select-folder-button"]');
    await expect(selectFolderBtn1).toBeVisible();
    await expect(selectFolderBtn1).toHaveText('Choose Folder');

    // Perform state operations
    await window1.evaluate(async () => {
      const api = (window as any).electronAPI;
      await api.clearAppState();
    });

    await electronApp1.close();

    // Second app instance - should start fresh
    const electronApp2 = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window2 = await electronApp2.firstWindow();
    await window2.waitForLoadState('domcontentloaded');

    // Verify functionality is maintained
    const selectFolderBtn2 = window2.locator('[data-testid="select-folder-button"]');
    await expect(selectFolderBtn2).toBeVisible();
    await expect(selectFolderBtn2).toHaveText('Choose Folder');
    await expect(selectFolderBtn2).toBeEnabled();

    // State should still be null after restart
    const stateAfterRestart = await window2.evaluate(async () => {
      const api = (window as any).electronAPI;
      const result = await api.getAppState();
      return {
        success: result.success,
        hasData: result.data !== null
      };
    });

    expect(stateAfterRestart.success).toBe(true);
    expect(stateAfterRestart.hasData).toBe(false);

    await electronApp2.close();
  });

  test('should handle progress listener registration without errors', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Test progress listener functionality
    const progressTest = await window.evaluate(async () => {
      const api = (window as any).electronAPI;
      
      let progressCallbackCalled = false;
      let callbackData = null;
      
      try {
        // Register progress listener
        api.onScanProgress((folderCount: number, fileCount: number) => {
          progressCallbackCalled = true;
          callbackData = { folderCount, fileCount };
        });
        
        // Remove progress listener
        api.removeScanProgressListener();
        
        return {
          success: true,
          progressCallbackCalled,
          callbackData
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    expect(progressTest.success).toBe(true);
    // Callback shouldn't be called since no actual scan happened
    expect(progressTest.progressCallbackCalled).toBe(false);

    await electronApp.close();
  });
});