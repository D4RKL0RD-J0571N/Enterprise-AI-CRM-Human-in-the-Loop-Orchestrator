import { test, expect } from '@playwright/test';

test.describe('UX Audit Fixes Validation', () => {
    test.beforeEach(async ({ page }: { page: any }) => {
        // Assume the application is running and accessible
        await page.goto('/dashboard/clients');
    });

    test('Action Hub dropdown remains open until outside click @stable', async ({ page }: { page: any }) => {
        // 1. Locate the first client's Action Hub trigger
        const firstActionTrigger = page.locator('table tbody tr').first().locator('button:has(svg.lucide-more-vertical)');

        // 2. Click to open
        await firstActionTrigger.click();

        // 3. Verify menu is visible
        const actionHub = page.locator('text=Action Hub');
        await expect(actionHub).toBeVisible();

        // 4. Capture screenshot for baseline
        await expect(page).toHaveScreenshot('action-hub-open.png');

        // 5. Move mouse away (simulating hover leave)
        await page.mouse.move(0, 0);

        // 6. Verify menu remains visible
        await expect(actionHub).toBeVisible();

        // 7. Click outside
        await page.locator('h1').click();

        // 8. Verify menu is hidden
        await expect(actionHub).not.toBeVisible();
    });

    test('Snapshot actions are persistently visible at lower opacity @stable', async ({ page }: { page: any }) => {
        await page.goto('/dashboard/settings/intelligence');
        await page.click('text=Knowledge Base');

        const firstSnapshotRow = page.locator('.group').first();
        const renameButton = firstSnapshotRow.locator('button[title*="Rename"]');

        // Verify it is visible even without hover (low opacity)
        await expect(renameButton).toBeVisible();
        await expect(firstSnapshotRow).toHaveScreenshot('snapshot-row-baseline.png');
    });

    test('Branding preview updates without flickers @stable', async ({ page }: { page: any }) => {
        await page.goto('/dashboard/settings/organization');
        await page.click('text=Visual Branding');

        const firstColorButton = page.locator('button[aria-label^="Select"]').first();
        await firstColorButton.click();

        const preview = page.locator('.relative.flex.items-center.justify-between.gap-6.mb-10').first();
        await expect(preview).toBeVisible();

        // Baseline for branding preview
        await expect(preview).toHaveScreenshot('branding-preview-update.png');
    });

    test('Responsive Layout: Mobile Sidebar @stable', async ({ page }: { page: any }) => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8
        await page.goto('/dashboard/clients');

        // Take a screenshot of the mobile layout
        await expect(page).toHaveScreenshot('mobile-clients-layout.png');
    });

    test('Critical Path: View All Activity Log navigates to Security Logs @stable', async ({ page }: { page: any }) => {
        await page.goto('/dashboard');

        // Click notification bell
        await page.locator('button[title="Notifications"]').click();

        // Click View All Activity Log
        await page.click('text=View All Activity Log');

        // Verify navigation
        await expect(page).toHaveURL(/.*settings\/developers/);
        await expect(page.locator('h1')).toContainText('Settings');
    });
});
