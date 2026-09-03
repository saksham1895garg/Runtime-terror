import { test, expect } from '@playwright/test';

test.describe('Route Protection E2E', () => {
  test('Anonymous user is redirected from developer route', async ({ page }) => {
    // Clear any potential session
    await page.context().clearCookies();
    await page.goto('/dev-dashboard');
    // Developer layout redirects to /login when unauthenticated
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Anonymous user is redirected from officer route', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    // Officer layout redirects to /login when unauthenticated
    await expect(page).toHaveURL(/.*\/login/);
  });
});
