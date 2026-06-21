import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // ensure clean state
  await page.context().clearCookies();
  await page.goto('/');
});

test('guest flow: continue as guest and see greeting', async ({ page }) => {
  await page.locator('input[placeholder="Your name (optional)"]').fill('GuestTest');
  await page.locator('button:has-text("Continue as Guest")').click();
  await page.waitForURL('**/customer');
  await expect(page.locator('text=Hi GuestTest')).toBeVisible();
});

test('customer AI assistant quick button responds', async ({ page }) => {
  // start guest and go to customer
  await page.locator('input[placeholder="Your name (optional)"]').fill('AiGuest');
  await page.locator('button:has-text("Continue as Guest")').click();
  await page.waitForURL('**/customer');
  // open assistant quick button
  const quick = page.locator('button:has-text("Suggest under ₹200")');
  await expect(quick).toBeVisible();
  await quick.click();
  // look for assistant reply text
  await expect(page.locator('text=Items under ₹200').first()).toBeVisible({ timeout: 5000 });
});

test('direct admin access without login redirects to landing', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/$/);
});

test('direct pos access without login redirects to landing', async ({ page }) => {
  await page.goto('/pos');
  await expect(page).toHaveURL(/\/$/);
});

test('direct kds access without login redirects to landing', async ({ page }) => {
  await page.goto('/kds');
  await expect(page).toHaveURL(/\/$/);
});
