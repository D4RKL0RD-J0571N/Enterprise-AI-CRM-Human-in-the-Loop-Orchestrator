import { test, expect } from '@playwright/test';

test.describe('Product Management Deep Test @stable', () => {
    test.beforeEach(async ({ page }) => {
        // Login as Jostin
        await page.goto('/login');
        await page.fill('input[type="text"]', 'Jostin');
        await page.fill('input[type="password"]', 'admin');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);
    });

    test('Full Product CRUD Lifecycle', async ({ page }) => {
        // 1. Navigate to Products
        await page.click('a[href="/dashboard/products"]');
        await expect(page).toHaveURL(/\/dashboard\/products/);

        // 2. Open Create Modal
        const createBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Add"), button:has-text("New")');
        if (await createBtn.count() > 0) {
            await createBtn.first().click();
        } else {
            // Fallback for icon-only button
            await page.click('button.bg-blue-600');
        }

        // 3. Fill Form
        const testName = `Deep Test Prod ${Date.now()}`;
        await page.fill('input[name="name"]', testName);
        await page.fill('textarea[name="description"]', 'Component-level integration test');
        await page.fill('input[name="price"]', '150');
        await page.fill('input[name="stock_quantity"]', '50');
        await page.click('button[type="submit"]');

        // 4. Verify in List
        await expect(page.locator(`text=${testName}`)).toBeVisible();

        // 5. Edit
        await page.click(`tr:has-text("${testName}") button:has-text("Edit"), tr:has-text("${testName}") button:has-text("Editar"), tr:has-text("${testName}") .lucide-edit`);
        await page.fill('input[name="price"]', '200');
        await page.click('button[type="submit"]');
        await expect(page.locator(`text=200`)).toBeVisible();

        // 6. Delete
        await page.click(`tr:has-text("${testName}") button:has-text("Delete"), tr:has-text("${testName}") button:has-text("Eliminar"), tr:has-text("${testName}") .lucide-trash`);
        // Confirm modal if exists
        const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Eliminar"), button:has-text("Delete")');
        if (await confirmBtn.count() > 0) await confirmBtn.click();

        await expect(page.locator(`text=${testName}`)).not.toBeVisible();
    });
});
