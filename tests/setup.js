// Setup file for Jest
// Importing testing-library extensions
require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');
const mockDb = require('./__mocks__/db');
const authUtils = require('./utils/auth-utils');

// Set up TextEncoder and TextDecoder for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set up mock database for tests
global.db = mockDb;

// Make auth utilities available globally in tests
global.authUtils = authUtils;

// Create JSDOM instance when running in Node environment
if (typeof window === 'undefined') {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
  });
  
  // Set up global variables for tests
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.MutationObserver = dom.window.MutationObserver;
  global.getComputedStyle = dom.window.getComputedStyle;
  global.location = dom.window.location;
  
  // Mock DOM APIs not implemented in jsdom
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));
}

// Mock console.error to not pollute test output
const originalConsoleError = console.error;
console.error = (...args) => {
  // Check if this is a React DOM render-related warning
  const message = args.join(' ');
  if (message.includes('Warning:') || message.includes('Error:')) {
    return;
  }
  originalConsoleError(...args);
};
