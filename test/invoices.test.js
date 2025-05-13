import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { createServer } from "../src/server.js";

describe("Invoices", () => {
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

  test("authenticated user can see 'Purchase invoices' tab in main menu", async () => {
    const response = await fetch(`http://localhost:${server.port}/invoices/1`, {
      headers: {
        'Cookie': 'session=valid-session-token'
      }
    });
    
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('Purchase invoices'); 
    expect(html).toContain('<a href="/purchase-invoices"'); // Link to purchase invoices
  });

  test("authenticated user can see 'New invoice' button on invoices page", async () => {
    const response = await fetch(`http://localhost:${server.port}/invoices/1`, {
      headers: {
        'Cookie': 'session=valid-session-token'
      }
    });
    
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('New invoice');
    expect(html).toContain('data-action="open-invoice-modal"'); // Button to open modal
  });

  test("new invoice modal contains all required fields", async () => {
    const response = await fetch(`http://localhost:${server.port}/invoice-form-partial`, {
      headers: {
        'Cookie': 'session=valid-session-token'
      }
    });
    
    const html = await response.text();
    expect(response.status).toBe(200);
    
    // Check for all required fields
    expect(html).toContain('name="date"');
    expect(html).toContain('name="description"');
    expect(html).toContain('name="quantity"');
    expect(html).toContain('name="paymentMethod"');
    expect(html).toContain('name="currency"');
    expect(html).toContain('name="invoiceNumber"');
    expect(html).toContain('name="vatPercentage"');
    expect(html).toContain('name="price"');
    
    // Check for calculation functionality indicator
    expect(html).toContain('data-calculate-sum');
    
    // Check for action buttons
    expect(html).toContain('Save</button>');
    expect(html).toContain('Cancel</button>');
  });

  test("invoice modal automatically calculates sum based on price, quantity and VAT", async () => {
    const response = await fetch(`http://localhost:${server.port}/calculate-invoice-sum`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=valid-session-token'
      },
      body: JSON.stringify({
        price: 100,
        quantity: 2,
        vatPercentage: 20
      })
    });
    
    const result = await response.json();
    expect(response.status).toBe(200);
    // 100 (price) * 2 (quantity) = 200, VAT 20% = 40, Total = 240
    expect(result.sum).toBe(240);
  });

  test("saving new invoice stores data and closes modal", async () => {
    const invoiceData = {
      date: '2023-05-15',
      description: 'Test invoice item',
      quantity: 2,
      paymentMethod: 'Credit Card',
      currency: 'USD',
      invoiceNumber: 'INV-2023-001',
      vatPercentage: 20,
      price: 100
    };
    
    const response = await fetch(`http://localhost:${server.port}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=valid-session-token'
      },
      body: JSON.stringify(invoiceData)
    });
    
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.invoice.id).toBeDefined();
  });

  test("after saving invoice, it appears in the invoice list", async () => {
    // First create an invoice
    const invoiceData = {
      date: '2023-05-15',
      description: 'Test invoice item',
      quantity: 2,
      paymentMethod: 'Credit Card',
      currency: 'USD',
      invoiceNumber: 'INV-2023-001',
      vatPercentage: 20,
      price: 100
    };
    
    await fetch(`http://localhost:${server.port}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=valid-session-token'
      },
      body: JSON.stringify(invoiceData)
    });
    
    // Then check if it appears in the list
    const response = await fetch(`http://localhost:${server.port}/invoices`, {
      headers: {
        'Cookie': 'session=valid-session-token'
      }
    });
    
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('INV-2023-001');
    expect(html).toContain('Test invoice item');
  });
}); 