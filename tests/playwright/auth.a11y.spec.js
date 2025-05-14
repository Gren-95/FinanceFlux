// @ts-check
import { test, expect } from '@playwright/test';
import { authenticateUser, checkA11y } from './helpers';

/**
 * More detailed accessibility tests for the authentication form
 */
test.describe('Authentication Accessibility', () => {
  const protectedUrl = '/invoices/3';
  
  test('sign-in form has proper HTML structure and landmarks', async ({ page }) => {
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check for proper HTML5 semantic structure
    await expect(page.locator('h2#signin-heading')).toBeVisible();
    await expect(page.locator('form.signin-form')).toBeAttached();
    
    // Check that form fields have proper associations
    const emailInputId = await page.locator('input[name="email"]').getAttribute('id');
    const emailLabelFor = await page.locator('label[for="email"]').getAttribute('for');
    expect(emailLabelFor).toBe(emailInputId);
    
    const passwordInputId = await page.locator('input[name="password"]').getAttribute('id');
    const passwordLabelFor = await page.locator('label[for="password"]').getAttribute('for');
    expect(passwordLabelFor).toBe(passwordInputId);
  });
    test('sign-in form is fully keyboard accessible', async ({ page }) => {
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Manually focus the email field to simulate user interaction
    await page.locator('#email').focus();
    const emailIsFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.id === 'email' : false;
    });
    expect(emailIsFocused).toBeTruthy();
    
    // Tab sequence test - pressing tab should move to password
    await page.keyboard.press('Tab');
    const passwordIsFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.id === 'password' : false;
    });
    expect(passwordIsFocused).toBeTruthy();      // Tab again to reach submit button
    await page.keyboard.press('Tab');
    const isFocusedOnSubmitButton = await page.evaluate(() => {
      const active = document.activeElement;
      // Use a safer way to check for button type
      return active ? active.tagName === 'BUTTON' && active.getAttribute('type') === 'submit' : false;
    });
    expect(isFocusedOnSubmitButton).toBeTruthy();
    
    // Test submission via keyboard
    await page.keyboard.press('Enter');
    
    // Form should stay visible since we didn't enter credentials
    await expect(page.locator('form.signin-form')).toBeVisible();
    
    // Now fill the form using keyboard only
    await page.keyboard.press('Tab'); // Tab back to email
    await page.keyboard.press('Tab'); // Loop back to email if needed
    
    // Fill email field
    await page.keyboard.type('valid@example.com');
    
    // Tab to password
    await page.keyboard.press('Tab');
    
    // Fill password field
    await page.keyboard.type('correctpassword');
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    
    // Submit form with Enter key
    await page.keyboard.press('Enter');
    
    // Wait for response to be processed
    await page.waitForTimeout(500);
    
    // Verify the form is no longer visible or we've navigated
    const isFormVisible = await page.locator('form.signin-form').isVisible().catch(() => false);
    if (isFormVisible) {
      // If form is still visible, we should see a success message or indication of progress
      await expect(page.locator('.error-message')).not.toBeVisible();
    }
  });
  
  test('sign-in form has proper error handling for screen readers', async ({ page }) => {
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Fill in invalid credentials
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Wait for the error message to appear
    await expect(page.locator('.error-message[role="alert"]')).toBeVisible({ timeout: 5000 });
    
    // Check that it has proper attributes for screen readers
    const hasAriaLive = await page.locator('.error-message').getAttribute('aria-live');
    expect(hasAriaLive).toBe('polite');
    
    // The error message should be properly associated with the form
    const errorText = await page.locator('.error-message[role="alert"]').textContent();
    expect(errorText?.trim().length).toBeGreaterThan(0);
  });
  
  test('sign-in form is usable at different viewport sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8 size
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check that form is visible and usable on small screens
    await expect(page.locator('form.signin-form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check that form is visible and usable on medium screens
    await expect(page.locator('form.signin-form')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check that form is visible and usable on large screens
    await expect(page.locator('form.signin-form')).toBeVisible();
  });
  
  test('authenticated pages are accessible after login', async ({ page, context }) => {
    // Authenticate the user
    await authenticateUser(context);
    
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check that the page is accessible
    await checkA11y(page);
    
    // Check for basic landmarks that should be present in the authenticated UI
    await expect(page.locator('h1, h2, h3')).toBeAttached();
    
    // Check that navigation elements are accessible
    const navElements = await page.locator('nav, [role="navigation"]').count();
    expect(navElements).toBeGreaterThan(0);
  });
});
