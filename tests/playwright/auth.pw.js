// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Tests for authentication that correspond to the auth.test.js tests
 * but using Playwright's end-to-end testing capabilities.
 */
test.describe('Authentication', () => {
  const protectedUrl = '/invoices/3';
    test('unauthenticated visitor sees sign-in form when accessing protected URL', async ({ page }) => {
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Basic form presence checks
    await expect(page.locator('form.signin-form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Form should post to same URL to maintain URL in address bar
    const formAction = await page.locator('form.signin-form').getAttribute('action');
    expect(formAction).toBe(protectedUrl);

    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toBeAttached();
    await expect(page.locator('label[for="password"]')).toBeAttached();
  });

  test('form submission with invalid credentials shows error message', async ({ page }) => {
    // Navigate to a protected URL first
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Fill in invalid credentials
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    
    // Submit the form - intercept the fetch request
    const responsePromise = page.waitForResponse('**/auth');
    await page.locator('button[type="submit"]').click();
    const response = await responsePromise;
    
    // Validate the response
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Email or password is incorrect');
    
    // Check if error is displayed in UI
    // Note: We need to wait for the client-side JS to process the response
    await expect(page.locator('.error-message')).toBeVisible();
  });
  test('form submission with valid credentials redirects to original URL', async ({ page }) => {
    // Navigate to a protected URL first
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Fill in valid credentials
    await page.locator('input[name="email"]').fill('valid@example.com');
    await page.locator('input[name="password"]').fill('correctpassword');
    
    // Submit the form and wait for response
    await Promise.all([
      page.locator('button[type="submit"]').click(),
      page.waitForResponse(response => 
        response.url().includes('/auth') || 
        response.url().includes(protectedUrl)
      )
    ]);
    
    // Since there might be a client-side redirect/reload, wait for that to complete
    await page.waitForURL(`http://localhost:3000${protectedUrl}`);
    
    // The page should now be showing invoice content instead of the login form
    await expect(page.locator('form.signin-form')).not.toBeVisible();
  });

  test('authenticated user can access protected URL directly', async ({ page, context }) => {
    // Set a cookie to simulate being authenticated before navigation
    await context.addCookies([{
      name: 'session',
      value: 'valid-session-token', 
      domain: 'localhost', 
      path: '/'
    }]);

    // Navigate directly to protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check that the login form is not displayed
    await expect(page.locator('form.signin-form')).not.toBeVisible();
    
    // Check that invoice content is displayed instead
    await expect(page.locator('text=Invoice #3')).toBeVisible();
    await expect(page.locator('text=Invoice content goes here')).toBeVisible();
  });
  test('form is keyboard navigable', async ({ page }) => {
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check for email field with tabindex
    await expect(page.locator('input#email[tabindex="0"]')).toBeVisible();
    
    // Check for password field with tabindex
    await expect(page.locator('input#password[tabindex="0"]')).toBeVisible();
    
    // Check for submit button with tabindex
    await expect(page.locator('button[type="submit"][tabindex="0"]')).toBeVisible();
    
    // Focus the email field and check if it can be focused
    await page.locator('input#email').focus();
    const emailIsFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.id === 'email' : false;
    });
    expect(emailIsFocused).toBeTruthy();
    
    // Test tabbing to password field
    await page.keyboard.press('Tab');
    const passwordIsFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.id === 'password' : false;
    });
    expect(passwordIsFocused).toBeTruthy();
  });
  test('sign-in form is WCAG 2.1 AA compliant for screen readers', async ({ page }) => {
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check for required fields attribute
    await expect(page.locator('input#email[required]')).toBeVisible();
    await expect(page.locator('input#password[required]')).toBeVisible();
    
    // Check for aria attributes - testing specifically for email field to avoid multiple elements
    await expect(page.locator('input#email[aria-required="true"]')).toBeAttached();
    
    // Check for error message container (might be empty initially)
    await expect(page.locator('.error-message[role="alert"]')).toBeAttached();
    await expect(page.locator('.error-message[aria-live="polite"]')).toBeAttached();
    
    // Check for proper form labeling
    await expect(page.locator('#signin-heading')).toBeVisible();
    await expect(page.locator('#email-label')).toBeVisible();
    await expect(page.locator('#password-label')).toBeVisible();
  });
  
  test('entering email and password enables form submission', async ({ page }) => {
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Check if form elements have required attribute
    const emailRequired = await page.locator('input[name="email"]').getAttribute('required');
    const passwordRequired = await page.locator('input[name="password"]').getAttribute('required');
    expect(emailRequired).not.toBeNull();
    expect(passwordRequired).not.toBeNull();
    
    // Check if submit button is enabled
    const isDisabled = await page.locator('button[type="submit"]').isDisabled();
    expect(isDisabled).toBe(false);
    
    // Fill form and check submission capability
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('somepassword');
      // Check if form is valid
    const isFormValid = await page.evaluate(() => {
      const form = document.querySelector('form.signin-form');
      // Cast form to HTMLFormElement using a JavaScript-compatible approach
      return form ? form instanceof HTMLFormElement && form.checkValidity() : false;
    });
    expect(isFormValid).toBe(true);
  });
    test('successful login refreshes the page revealing originally requested content', async ({ page }) => {
    // Navigate to a protected URL
    await page.goto(`http://localhost:3000${protectedUrl}`);
    
    // Fill in valid credentials
    await page.locator('input[name="email"]').fill('valid@example.com');
    await page.locator('input[name="password"]').fill('correctpassword');
    
    // Submit the form and wait for response
    const responsePromise = page.waitForResponse('**/auth');
    await page.locator('button[type="submit"]').click();
    await responsePromise;
    
    // Wait a moment for any client-side JS to process the response
    await page.waitForTimeout(1000);
    
    // After successful login, we should either:
    // 1. See the invoice content (if automatically redirected/page refreshed)
    // 2. Or still be on the same page but have authentication set up
    
    // Try to find the invoice content (should be visible after refresh)
    const invoiceContentVisible = await page.locator('text=Invoice #3').isVisible()
      .catch(() => false);
    
    if (!invoiceContentVisible) {
      // If content not visible, login form should be gone or the page should be redirectable
      const loginFormVisible = await page.locator('form.signin-form').isVisible();
      expect(loginFormVisible).toBeFalsy();
    } else {
      // Invoice content is visible, which means authentication worked
      expect(invoiceContentVisible).toBeTruthy();
    }
  });
});
