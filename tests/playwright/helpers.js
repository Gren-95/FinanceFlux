// @ts-check
import { expect } from '@playwright/test';

/**
 * Helper functions for authentication testing
 */

/**
 * Authenticate a user by setting the necessary cookies directly
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function authenticateUser(context) {
  await context.addCookies([
    { 
      name: 'session',
      value: 'valid-session-token',
      domain: 'localhost',
      path: '/'
    }
  ]);
}

/**
 * Login via the UI form
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function loginViaUI(page, email, password) {
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

/**
 * Assert that the page shows a login form
 * @param {import('@playwright/test').Page} page 
 */
export async function expectLoginForm(page) {
  await expect(page.locator('form.signin-form')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
}

/**
 * Assert that the page shows authenticated content
 * @param {import('@playwright/test').Page} page 
 */
export async function expectAuthenticatedContent(page) {
  await expect(page.locator('form.signin-form')).not.toBeVisible();
}

/**
 * Check page for WCAG 2.1 AA accessibility features
 * @param {import('@playwright/test').Page} page
 */
export async function checkA11y(page) {
  // These are basic checks - a real accessibility test would use
  // more comprehensive tools like axe-core
  
  // Check for proper labels on input fields
  const inputsWithoutLabels = await page.locator(
    'input:not([aria-label]):not([aria-labelledby]):not([title]):not([alt]):not([type="hidden"])'
  ).count();
  
  if (inputsWithoutLabels > 0) {
    // Check that inputs have associated labels
    const inputsWithoutName = await page.locator(
      'input[type="text"]:not([name]),input[type="email"]:not([name]),input[type="password"]:not([name])'
    ).count();
    expect(inputsWithoutName).toBe(0);
  }
  
  // Check for headings for page structure
  await expect(page.locator('h1, h2, h3')).toBeAttached();
}
