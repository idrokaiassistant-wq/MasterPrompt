import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Prompt Master Pro/);
  });

  test('should show generate button', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /yaratish|generate/i });
    await expect(generateButton).toBeVisible();
  });

  test('should show prompt input', async ({ page }) => {
    const input = page.getByPlaceholder(/prompt|kiritish/i);
    await expect(input).toBeVisible();
  });
});
