import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: '../tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { open: 'never' }], ['list']],
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:5173', // Fallback to Vite default
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Use @stable tag to filter baseline tests
    grep: [/@stable/],
});
