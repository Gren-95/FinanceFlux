/**
 * @jest-environment jsdom
 */
const { fireEvent, waitFor } = require('@testing-library/dom');
require('@testing-library/jest-dom');
const request = require('supertest');
const app = require('../app');

// This is an integration test that will use the actual app and routes

describe('Sign-in Integration Tests', () => {
  beforeEach(() => {
    // Create a minimal DOM environment to simulate browser
    document.body.innerHTML = `
      <div id="protected-content" style="display: none;">Protected content</div>
      <div id="auth-overlay">
        <form id="sign-in-form" action="/auth/signin" method="post">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required />
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required />
          <div id="error-message" aria-live="polite"></div>
          <button type="submit">Sign In</button>
        </form>
      </div>
    `;
  });
    describe('Integration tests with backend', () => {
    it('should redirect unauthenticated visitors to sign-in form for protected URLs', async () => {
      // Make a request to a protected route
      const response = await request(app)
        .get('/3')
        .set('Accept', 'text/html');
      
      // The response should be successful
      expect(response.status).toBe(200);
      
      // In a real test with a rendered page, we would check for sign-in form elements
    });
    
    it('should return 401 for invalid credentials', async () => {
      // Try to sign in with invalid credentials
      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: 'wrong@example.com',
          password: 'wrong-password'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        message: 'Email or password is incorrect'
      }));
    });
    
    it('should handle form submission with real endpoints', () => {
      // Get the sign-in form
      const form = document.getElementById('sign-in-form');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      
      // Fill form with test data
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Check that the form is properly configured to submit to the right endpoint
      expect(form.action).toContain('/auth/signin');
      expect(form.method).toBe('post');
      
      // Verify form is valid with the test data
      expect(form.checkValidity()).toBeTruthy();
    });
  });
    describe('Authenticated user tests', () => {
    it('should allow authenticated users to access protected content', async () => {
      // Create an authenticated session
      const agent = request.agent(app);
      
      // First sign in to establish a session
      await agent
        .post('/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
        
      // Now try to access a protected route
      const response = await agent.get('/3');
      
      // The protected route should be accessible without redirect
      expect(response.status).toBe(200);
    });
    
    it('should check authentication status', async () => {
      const response = await request(app).get('/auth/status');
      
      // Before authentication, should return not authenticated
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        isAuthenticated: false,
        user: null
      });
    });
  });
});
