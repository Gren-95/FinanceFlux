const request = require('supertest');
const express = require('express');
const session = require('express-session');
const app = require('../app');

// Import our test configuration
const { testUser, mockDb } = require('./test-config');

// Make sure the app is using our mock database for testing
global.db = mockDb;

describe('Authentication API', () => {
  beforeEach(() => {
    // Clear any mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /auth/signin', () => {
    it('should return 401 with error message for invalid email', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'invalidpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Email or password is incorrect'
      });
    });    it('should return 401 with error message for invalid password', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Email or password is incorrect'
      });
      
      // Verify we're using the same generic error message for both cases
      // which is a security best practice
    });

    it('should return 200 and set session for valid credentials', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        returnTo: '/' // Default redirect
      });
    });    it('should return the original requested URL after successful login', async () => {
      // Setup a request with a session
      const agent = request.agent(app);
      
      // First hit a protected route to set the returnTo
      await agent.get('/3');
      
      // Then sign in
      const response = await agent
        .post('/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.returnTo).toBe('/3');
    });
  });
  describe('GET /auth/status', () => {
    it('should return not authenticated for unauthenticated users', async () => {
      const response = await request(app).get('/auth/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        isAuthenticated: false,
        user: null
      });
    });

    it('should return authenticated status for authenticated users', async () => {
      // First login to get an authenticated session
      const agent = request.agent(app);
      
      // Sign in to create a real authenticated session
      await agent
        .post('/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password
        });
        
      // Check authentication status
      const response = await agent.get('/auth/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        isAuthenticated: true,
        user: expect.objectContaining({
          email: testUser.email
        })
      });
    });
  });
});
