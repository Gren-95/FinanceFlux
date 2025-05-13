import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { createServer } from "../src/server.js";

describe("Authentication", () => {
  let server;
  
  beforeEach(async () => {
    // Create a test server instance
    server = await createServer({ testing: true });
  });
  
  afterEach(async () => {
    // Close the server if it exists
    if (server) {
      await server.close();
    }
  });

  test("unauthenticated visitor sees sign-in form when accessing protected URL", async () => {
    const protectedUrl = "/invoices/3";
    const response = await fetch(`http://localhost:${server.port}${protectedUrl}`);
    const html = await response.text();
    
    // Basic form presence checks
    expect(response.status).toBe(200);
    expect(html).toContain("<form");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).toContain('type="submit"');
    
    // Form should post to same URL to maintain URL in address bar
    expect(html).toContain(`action="${protectedUrl}"`);

    // WCAG 2.1 AA compliance checks
    expect(html).toContain('aria-label');
    expect(html).toContain('<label for="');
  });

  test("form submission with invalid credentials shows error message", async () => {
    const protectedUrl = "/invoices/3";
    const response = await fetch(`http://localhost:${server.port}${protectedUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    
    const result = await response.json();
    expect(result.error).toBe("Email or password is incorrect");
  });

  test("form submission with valid credentials redirects to original URL", async () => {
    const protectedUrl = "/invoices/3";
    const response = await fetch(`http://localhost:${server.port}${protectedUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'valid@example.com',
        password: 'correctpassword'
      })
    });
    
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.redirectUrl).toBe(protectedUrl);
  });

  test("authenticated user can access protected URL directly", async () => {
    const protectedUrl = "/invoices/3";
    const response = await fetch(`http://localhost:${server.port}${protectedUrl}`, {
      headers: {
        'Cookie': 'session=valid-session-token'  // We'll implement proper session handling later
      }
    });
    
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).not.toContain('name="email"'); // Should not show login form
    expect(html).toContain('Invoice #3'); // Should show actual invoice content
    expect(html).toContain('Invoice content goes here'); // Should show invoice content
  });

  test("form is keyboard navigable", async () => {
    const protectedUrl = "/invoices/3";
    const response = await fetch(`http://localhost:${server.port}${protectedUrl}`);
    const html = await response.text();
    
    // Check for proper tab index and keyboard navigation attributes
    expect(html).toContain('tabindex="0"');
    expect(html).not.toContain('tabindex="-1"');
    
    // Check for proper focus management
    expect(html).toContain('autofocus');
  });

  test("sign-in form is WCAG 2.1 AA compliant for screen readers", async () => {
    const protectedUrl = "/invoices/3";
    const response = await fetch(`http://localhost:${server.port}${protectedUrl}`);
    const html = await response.text();
    
    // Check for proper ARIA attributes for screen readers
    expect(html).toContain('aria-required="true"');
    expect(html).toContain('aria-labelledby="');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="polite"');
    
    // Check for form labeling
    expect(html).toContain('id="signin-heading"');
    expect(html).toContain('id="email-label"');
    expect(html).toContain('id="password-label"');
  });
  
  test("entering email and password enables form submission", async () => {
    const protectedUrl = "/invoices/3";
    const response = await fetch(`http://localhost:${server.port}${protectedUrl}`);
    const html = await response.text();
    
    // Check for required attribute on input fields
    expect(html).toContain('required');
    
    // Check for preventDefault in the JS part
    expect(html).toContain('e.preventDefault()');
    
    // Check for form submission handling
    expect(html).toContain('addEventListener(\'submit\'');
  });
  
  test("successful login refreshes the page revealing originally requested content", async () => {
    const protectedUrl = "/invoices/3";
    const responseHtml = await fetch(`http://localhost:${server.port}${protectedUrl}`);
    const html = await responseHtml.text();
    
    // Check for page reload after successful authentication
    expect(html).toContain('window.location.reload()');
  });
});
