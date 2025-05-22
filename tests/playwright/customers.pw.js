import { test, expect } from '@playwright/test';

test.describe('Customer functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // If we're not already logged in, we need to sign in
    const dashboardLink = page.locator('a', { hasText: 'Dashboard' });
    const isLoggedIn = await dashboardLink.isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      // We might be on the home page needing to sign in
      if (await page.locator('.signin-form').isVisible()) {
        // We're on a page with a sign-in form
        await page.fill('input[name="email"]', 'valid@example.com');
        await page.fill('input[name="password"]', 'correctpassword');
        await page.click('button[type="submit"]');
      } else {
        // Navigate to an authenticated page to trigger the login form
        await page.goto('/dashboard');
        await page.waitForSelector('.signin-form');
        await page.fill('input[name="email"]', 'valid@example.com');
        await page.fill('input[name="password"]', 'correctpassword');
        await page.click('button[type="submit"]');
      }
      
      // Wait for authentication to complete
      await page.waitForLoadState('networkidle');
    }
    
    // Verify we're logged in by checking for the dashboard link
    await expect(page.locator('a', { hasText: 'Dashboard' })).toBeVisible();
  });

  test('displays customers tab in main menu', async ({ page }) => {
    // Check for customers tab in navigation
    await expect(page.locator('a', { hasText: 'Customers' })).toBeVisible();
  });

  test('opens customer page when clicking on Customers tab', async ({ page }) => {
    // Click on the Customers tab
    await page.click('a:has-text("Customers")');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Verify customer page loaded
    await expect(page.locator('h1:has-text("Customers")')).toBeVisible();
    await expect(page.locator('button:has-text("New customer")')).toBeVisible();
  });

  test('can add a new customer', async ({ page }) => {
    // Navigate to customers page
    await page.click('a:has-text("Customers")');
    await page.waitForLoadState('networkidle');
    
    // Click new customer button
    await page.click('button:has-text("New customer")');
    
    // Wait for modal to appear - with longer timeout as it might take time to load
    await expect(page.locator('#customer-modal')).toBeVisible({ timeout: 10000 });
    
    // Fill out the form - wait for elements to be editable
    const testName = 'Test Customer ' + Date.now();
    await page.waitForSelector('#name', { state: 'visible' });
    await page.fill('#name', testName);
    await page.fill('#address', '123 Test Street');
    await page.fill('#email', 'test@example.com');
    
    // Debug: log form values
    console.log('Submitting customer form with name:', testName);
    
    // Submit the form
    await page.click('#save-button');
    
    // Handle both cases: JSON response or redirect
    try {
      // Wait for navigation to the customers page
      await page.waitForURL('**/customers', { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      
      // Verify the new customer appears in the list
      await expect(page.locator(`td:has-text("${testName}")`)).toBeVisible({ timeout: 10000 });
    } catch (e) {
      // If we get a JSON response instead of a navigation, manually go to customers page
      console.log('Did not detect navigation, checking for JSON response...');
      
      // Check if we got JSON response
      if (await page.locator('pre').isVisible()) {
        const jsonText = await page.locator('pre').innerText();
        console.log('JSON response:', jsonText);
        
        // Navigate to customers page manually
        await page.goto('/customers');
        await page.waitForLoadState('networkidle');
        
        // Verify the new customer appears in the list
        await expect(page.locator(`td:has-text("${testName}")`)).toBeVisible({ timeout: 10000 });
      } else {
        // If we can't handle it, rethrow the error
        throw e;
      }
    }
  });
});