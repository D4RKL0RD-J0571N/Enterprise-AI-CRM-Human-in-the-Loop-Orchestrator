import { test, expect } from '@playwright/test';

test('Debug Login Flow @stable', async ({ page }) => {
    await page.goto('/login');
    await page.screenshot({ path: 'login-page.png' });

    await page.fill('input[type="text"]', 'Jostin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Wait for redirect
    try {
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });
        console.log("Successfully redirected to dashboard");
    } catch (e) {
        console.log("Redirect failed or timed out");
        await page.screenshot({ path: 'login-failed.png' });
        const bodyText = await page.innerText('body');
        console.log("Body Text on Failure:", bodyText.substring(0, 500));
        throw e;
    }

    await page.screenshot({ path: 'dashboard-success.png' });
});
