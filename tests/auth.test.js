import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { createServer } from "../server.js";

// This test file verifies user stories for the sign-in functionality
// as described in user_story_sign_in.md

describe("Authentication", () => {
  let server;
  
  // Before each test
  beforeEach(async () => {
    // Create a test server instance
    server = await createServer({ testing: true });
  });
  
  // After each test
  afterEach(async () => {
    // Close the server if it exists
    if (server) {
      await server.close();
    }
  });

  test("unauthenticated visitor sees sign-in form when accessing protected URL", async () => {
    // Define a protected URL path to test
    const protectedUrl = "/invoices/3";
    
    // Make request to protected URL without authentication
    const response = await fetch(`http://localhost:${server.port}${protectedUrl}`);
    const html = await response.text();
    
    // Assertions
    expect(response.status).toBe(200); // Should return 200 OK
    expect(html).toContain("<form"); // Should contain a form
    expect(html).toContain('name="email"'); // Should have email field
    expect(html).toContain('name="password"'); // Should have password field
    expect(html).toContain('type="submit"'); // Should have submit button
    
    // The form should post to the same URL to maintain the URL in address bar
    expect(html).toContain(`action="${protectedUrl}"`);
  });
  
  test("form submission with valid credentials redirects to originally requested URL", async () => {
    // Define a protected URL to test
    const protectedUrl = "/invoices/3";
    const loginUrl = `http://localhost:${server.port}${protectedUrl}`;
    
    // Create credentials for login
    const credentials = {
      email: "user@example.com",
      password: "validpassword123"
    };
    
    // Submit the form with valid credentials
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credentials),
      redirect: "manual" // Don't follow redirects
    });
    
    // Check for redirect response
    expect(response.status).toBe(302);
    
    // Verify redirect location matches the original URL
    const redirectLocation = response.headers.get("Location");
    expect(redirectLocation).toBe(protectedUrl);
  });
  
  test("entering invalid credentials shows generic error message", async () => {
    // Define a protected URL to test
    const protectedUrl = "/invoices/3";
    const loginUrl = `http://localhost:${server.port}${protectedUrl}`;
    
    // Create invalid credentials
    const invalidCredentials = {
      email: "user@example.com",
      password: "wrongpassword"
    };
    
    // Submit the form with invalid credentials
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(invalidCredentials)
    });
    
    // Check for unsuccessful response
    expect(response.status).toBe(401);
    
    // Parse the JSON response
    const responseBody = await response.json();
    
    // Verify error message
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Email or password is incorrect");
  });
    test("already authenticated user directly sees protected content", async () => {
    // Define a protected URL to test
    const protectedUrl = "/invoices/3";
    const url = `http://localhost:${server.port}${protectedUrl}`;
    
    // Make request with authentication cookie
    const response = await fetch(url, {
      headers: {
        "Cookie": "authToken=valid-auth-token; Path=/"
      }
    });
    
    const html = await response.text();
    
    // Should return success status
    expect(response.status).toBe(200);
    
    // Should contain invoice details, not sign-in form
    expect(html).toContain('<div id="invoice-details">');
    expect(html).not.toContain('name="password"');
  });

  test("sign-in form is accessible and keyboard-navigable", async () => {
    // Import JSDOM for this test to help with accessibility testing
    const { JSDOM } = await import("jsdom");
    
    // Define a protected URL to test
    const protectedUrl = "/invoices/3";
    const url = `http://localhost:${server.port}${protectedUrl}`;
    
    // Make request without authentication to get the form
    const response = await fetch(url);
    const html = await response.text();
    
    // Create a DOM from the HTML response
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Find the form
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    
    // Check for proper labels
    const inputs = form.querySelectorAll("input");
    
    for (const input of inputs) {
      // Each input should have either:
      // 1. A label element with a "for" attribute that matches the input's ID
      // 2. An aria-label attribute
      const inputId = input.getAttribute("id");
      if (inputId) {
        const label = document.querySelector(`label[for="${inputId}"]`);
        expect(label).not.toBeNull();
      } else {
        const ariaLabel = input.getAttribute("aria-label");
        expect(ariaLabel).not.toBeNull();
      }
    }
    
    // Check that form is keyboard-navigable (all interactive elements are in the tab order)
    const interactiveElements = form.querySelectorAll("input, button");
    for (const el of interactiveElements) {
      // Elements should not have tabindex=-1 (which would remove from tab order)
      const tabindex = el.getAttribute("tabindex");
      if (tabindex) {
        expect(parseInt(tabindex)).not.toBe(-1);
      }
    }
  });
});
