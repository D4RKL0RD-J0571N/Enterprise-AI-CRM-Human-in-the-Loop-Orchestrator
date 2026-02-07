import { test, expect } from '@playwright/test';

test.describe('Settings & Configuration Deep Test @stable', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="text"]', 'Jostin');
        await page.fill('input[type="password"]', 'admin');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);
    });

    test('Organization Settings Update @stable', async ({ page }) => {
        await page.goto('/dashboard/settings/organization');
        await expect(page.locator('h2')).toContainText(/Organización|Organization/i);

        // Update name or something
        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.count() > 0) {
            await nameInput.fill('Jostin AI System V2');
            await page.click('button:has-text("Guardar"), button:has-text("Save")');
            await expect(page.locator('text=/Saved|Guardado/i').first()).toBeVisible();
        }
    });

    test('Intelligence Settings Toggle', async ({ page }) => {
        await page.goto('/dashboard/settings/intelligence');
        // Toggle some guardrail or setting
        const toggle = page.locator('button[role="switch"]').first();
        if (await toggle.count() > 0) {
            const prevState = await toggle.getAttribute('aria-checked');
            await toggle.click();
            const newState = await toggle.getAttribute('aria-checked');
            expect(newState).not.toBe(prevState);
        }
    });
});
