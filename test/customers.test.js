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
        'Accept': 'application/json',
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

  test("authenticated user can edit an existing customer", async () => {
    // First create a customer
    const customerData = {
      name: "Customer To Edit",
      address: "456 Original St",
      email: "original@customer.com"
    };
    
    const createResponse = await fetch(`http://localhost:${server.port}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': 'session=valid-session-token'
      },
      body: JSON.stringify(customerData)
    });
    
    const createResult = await createResponse.json();
    expect(createResponse.status).toBe(200);
    expect(createResult.success).toBe(true);
    
    // Now edit the customer
    const customerId = createResult.customer.id;
    const updatedData = {
      name: "Updated Customer Name",
      address: "789 New Address",
      email: "updated@customer.com"
    };
    
    const editResponse = await fetch(`http://localhost:${server.port}/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': 'session=valid-session-token'
      },
      body: JSON.stringify(updatedData)
    });
    
    const editResult = await editResponse.json();
    expect(editResponse.status).toBe(200);
    expect(editResult.success).toBe(true);
    expect(editResult.customer.id).toBe(customerId);
    expect(editResult.customer.name).toBe(updatedData.name);
    expect(editResult.customer.address).toBe(updatedData.address);
    expect(editResult.customer.email).toBe(updatedData.email);
    
    // Verify the customer was updated by fetching it
    const getResponse = await fetch(`http://localhost:${server.port}/customers/${customerId}`, {
      headers: {
        'Cookie': 'session=valid-session-token'
      }
    });
    
    const html = await getResponse.text();
    expect(getResponse.status).toBe(200);
    expect(html).toContain(updatedData.name);
    expect(html).toContain(updatedData.address);
    expect(html).toContain(updatedData.email);
  });
});