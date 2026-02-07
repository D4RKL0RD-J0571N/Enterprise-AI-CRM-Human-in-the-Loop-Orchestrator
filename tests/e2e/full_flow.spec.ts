import { test, expect } from '@playwright/test';

test.describe('Full Stack Integrity Check @stable', () => {
    test.setTimeout(30000);

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
        page.on('request', request => console.log(`FETCH START: ${request.method()} ${request.url()}`));
        page.on('requestfailed', request => console.log(`FETCH ERROR: ${request.method()} ${request.url()} | ${request.failure()?.errorText}`));
        page.on('response', response => {
            if (response.status() >= 400) {
                console.log(`FETCH RESPONSE ERROR: ${response.status()} ${response.url()}`);
            }
        });
    });

    test('Admin Login Flow @stable', async ({ page }) => {
        await page.goto('/login');
        await page.locator('input[type="text"]').type('Jostin', { delay: 50 });
        await page.locator('input[type="password"]').type('admin', { delay: 50 });

        await Promise.all([
            page.waitForURL(/\/dashboard/, { timeout: 15000 }),
            page.click('button[type="submit"]')
        ]);

        await expect(page.locator('nav')).toBeVisible();
    });

    test('Dashboard Interactions @stable', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="text"]', 'Jostin');
        await page.fill('input[type="password"]', 'admin');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);
        await expect(page.locator('text=/Ingresos|Revenue/i').first()).toBeVisible();
    });

    test('Chat Simulation @stable', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="text"]', 'Jostin');
        await page.fill('input[type="password"]', 'admin');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);
        await page.click('a[href="/dashboard/chat"]');

        // Wait for seeded conversation to appear and click it
        const chatItem = page.locator('text=Cliente de Prueba');
        await expect(chatItem).toBeVisible({ timeout: 10000 });
        await chatItem.click();

        // Verify input is visible in the opened ChatWindow
        await expect(page.locator('input[placeholder*="mensaje"], input[placeholder*="message"]')).toBeVisible();
    });
});
