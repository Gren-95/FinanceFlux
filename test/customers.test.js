import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { createServer } from "../src/server.js";

describe("Customer functionality", () => {
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

  test("authenticated user can see customers page", async () => {
    const response = await fetch(`http://localhost:${server.port}/customers`, {
      headers: {
        'Cookie': 'session=valid-session-token'
      }
    });
    
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<h1>Customers</h1>");
    expect(html).toContain("New customer");
  });

  test("unauthenticated user is redirected to signin form", async () => {
    const response = await fetch(`http://localhost:${server.port}/customers`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    expect(html).toContain("Sign In");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
  });

  test("authenticated user can add a new customer", async () => {
    const customerData = {
      name: "Test Customer",
      address: "123 Test St",
      email: "test@customer.com"
    };
    
    const response = await fetch(`http://localhost:${server.port}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=valid-session-token'
      },
      body: JSON.stringify(customerData)
    });
    
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.customer.name).toBe(customerData.name);
    expect(result.customer.address).toBe(customerData.address);
    expect(result.customer.email).toBe(customerData.email);
    expect(result.customer.id).toBeDefined();
  });
});