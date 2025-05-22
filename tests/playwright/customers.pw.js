import { test, expect } from '@playwright/test';

test.describe('Customer functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page
    await page.goto('/');
    
    // Sign in
    await page.fill('input[name="email"]', 'valid@example.com');
    await page.fill('input[name="password"]', 'correctpassword');
    await page.click('button[type="submit"]');
    
    // Verify we're logged in by checking for the dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('displays customers tab in main menu', async ({ page }) => {
    // Check for customers tab in navigation
    await expect(page.locator('a', { hasText: 'Customers' })).toBeVisible();
  });

  test('opens customer page when clicking on Customers tab', async ({ page }) => {
    // Click on the Customers tab
    await page.click('a', { hasText: 'Customers' });
    
    // Verify customer page loaded
    await expect(page.locator('h1', { hasText: 'Customers' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'New customer' })).toBeVisible();
  });

  test('can add a new customer', async ({ page }) => {
    // Navigate to customers page
    await page.click('a', { hasText: 'Customers' });
    
    // Click new customer button
    await page.click('button', { hasText: 'New customer' });
    
    // Wait for modal to appear
    await expect(page.locator('#customer-modal')).toBeVisible();
    
    // Fill out the form
    const testName = 'Test Customer ' + Date.now();
    await page.fill('#name', testName);
    await page.fill('#address', '123 Test Street');
    await page.fill('#email', 'test@example.com');
    
    // Submit the form
    await page.click('#save-button');
    
    // Wait for page to reload
    await page.waitForLoadState('networkidle');
    
    // Verify the new customer appears in the list
    await expect(page.locator('td', { hasText: testName })).toBeVisible();
  });
});