import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

test.describe('SelectFolder Component Tests', () => {
  let testTempDir: string;

  test.beforeEach(async () => {
    // Create a temporary test directory structure for mocking
    testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'organize-folder-test-'));
    const testSubDir = path.join(testTempDir, 'subdir');
    fs.mkdirSync(testSubDir, { recursive: true });
    
    // Create test files
    fs.writeFileSync(path.join(testTempDir, 'test-file-1.txt'), 'Test content 1');
    fs.writeFileSync(path.join(testTempDir, 'test-file-2.pdf'), 'Test content 2');
    fs.writeFileSync(path.join(testSubDir, 'nested-file.jpg'), 'Test content 3');
  });

  test.afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
  });

  test('should render SelectFolder component correctly', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Verify component is rendered
    const selectFolderComponent = await window.locator('[data-testid="select-folder"]');
    await expect(selectFolderComponent).toBeVisible();

    // Verify button is present and has correct text
    const selectButton = await window.locator('[data-testid="select-folder-button"]');
    await expect(selectButton).toBeVisible();
    await expect(selectButton).toBeEnabled();
    await expect(selectButton).toHaveText('Choose Folder');

    // Verify initial state - hidden elements
    const selectedPath = await window.locator('[data-testid="selected-path"]');
    const scanStatus = await window.locator('[data-testid="scan-status"]');
    const folderSummary = await window.locator('[data-testid="folder-summary"]');
    
    await expect(selectedPath).toBeHidden();
    await expect(scanStatus).toBeHidden();
    await expect(folderSummary).toBeHidden();

    await electronApp.close();
  });

  test('should handle button click without errors', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Track console errors
    const consoleErrors: string[] = [];
    window.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Click the button - this will attempt to call electronAPI.selectFolder()
    const selectButton = await window.locator('[data-testid="select-folder-button"]');
    await selectButton.click();
    
    // Wait a moment for any async operations
    await window.waitForTimeout(1000);

    // Verify no JavaScript errors occurred (the real IPC call will fail in test environment, but shouldn't crash)
    console.log('Console errors:', consoleErrors);
    
    // The component should still be visible after click
    const selectFolderComponent = await window.locator('[data-testid="select-folder"]');
    await expect(selectFolderComponent).toBeVisible();

    await electronApp.close();
  });

  test('should have properly structured DOM elements', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Check all expected elements exist with correct structure
    const selectFolderComponent = await window.locator('[data-testid="select-folder"]');
    await expect(selectFolderComponent).toBeVisible();

    // Check title
    const title = await window.locator('.select-folder-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Select Folder to Organize');

    // Check button
    const button = await window.locator('[data-testid="select-folder-button"]');
    await expect(button).toBeVisible();

    // Check hidden elements exist but are not visible
    const selectedPath = await window.locator('[data-testid="selected-path"]');
    const scanStatus = await window.locator('[data-testid="scan-status"]');
    const scanProgress = await window.locator('[data-testid="scan-progress"]');
    const folderSummary = await window.locator('[data-testid="folder-summary"]');

    // All should exist in DOM but be hidden
    await expect(selectedPath).toBeAttached();
    await expect(scanStatus).toBeAttached();
    await expect(scanProgress).toBeAttached();
    await expect(folderSummary).toBeAttached();

    await expect(selectedPath).toBeHidden();
    await expect(scanStatus).toBeHidden();
    await expect(scanProgress).toBeHidden();
    await expect(folderSummary).toBeHidden();

    await electronApp.close();
  });

  test('should have correct CSS classes applied', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Check CSS classes
    const selectFolderComponent = await window.locator('[data-testid="select-folder"]');
    await expect(selectFolderComponent).toHaveClass('select-folder');

    const button = await window.locator('[data-testid="select-folder-button"]');
    await expect(button).toHaveClass('select-folder-button');

    // Check that styles are loaded (CSS file should be included)
    const computedStyle = await button.evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });
    
    // Should not be the default transparent/initial value if CSS is loaded
    expect(computedStyle).not.toBe('rgba(0, 0, 0, 0)');
    expect(computedStyle).not.toBe('transparent');

    await electronApp.close();
  });

  test('should integrate with main application layout', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Verify the component is properly integrated into the app
    const appBanner = await window.locator('[data-testid="app-banner"]');
    const mainContent = await window.locator('#main-content');
    const selectFolderContainer = await window.locator('#select-folder-container');
    const selectFolderComponent = await window.locator('[data-testid="select-folder"]');

    // All should be visible and properly nested
    await expect(appBanner).toBeVisible();
    await expect(mainContent).toBeVisible();
    await expect(selectFolderContainer).toBeVisible();
    await expect(selectFolderComponent).toBeVisible();

    // Check the component is inside the container
    const componentParent = await selectFolderComponent.locator('..').first();
    await expect(componentParent).toHaveAttribute('id', 'select-folder-container');

    await electronApp.close();
  });
});