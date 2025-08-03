import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import * as path from 'path';

test.describe('Organize Folder App', () => {
  test('should display the header "Organize Folder"', async () => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    // Get the first window that the app opens
    const window = await electronApp.firstWindow();

    // Wait for the app to load
    await window.waitForLoadState('domcontentloaded');

    // Check if the banner exists
    const banner = window.locator('[data-testid="app-banner"]');
    await expect(banner).toBeVisible();

    // Check if the banner title exists and contains correct text
    const bannerTitle = window.locator('[data-testid="banner-title"]');
    await expect(bannerTitle).toBeVisible();
    await expect(bannerTitle).toHaveText('Organize Folder');

    // Check if the main content area exists
    const mainContent = window.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // Check if the SelectFolder component button exists
    const selectFolderBtn = window.locator('[data-testid="select-folder-button"]');
    await expect(selectFolderBtn).toBeVisible();
    await expect(selectFolderBtn).toHaveText('Choose Folder');

    // Close the app
    await electronApp.close();
  });

  test('should have correct window title', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Check window title
    const title = await window.title();
    expect(title).toBe('Organize Folder');

    await electronApp.close();
  });

  test('select folder button should be clickable', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main/main.js')],
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    const selectFolderBtn = window.locator('[data-testid="select-folder-button"]');
    await expect(selectFolderBtn).toBeEnabled();
    
    // Click the button (this will attempt to call electronAPI)
    await selectFolderBtn.click();

    await electronApp.close();
  });
});