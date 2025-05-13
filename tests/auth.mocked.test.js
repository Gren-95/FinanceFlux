const request = require('supertest');
const express = require('express');
const session = require('express-session');
const authRouter = require('../routes/auth');

// Mock database setup
const mockUsers = [{
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password_hash: '7a9c1085d17841ff98775b16aad51c92ff2a9b7acb0ab82202b867773530f5402735da27ef5e74fe7ae8a7536c76a1e17933f0d555b28413c51c911c97f797d7',
  password_salt: '0123456789abcdef'
}];

// Mock database get function
const mockDb = {
  get: jest.fn((query, params) => {
    if (query.includes('SELECT * FROM users')) {
      const email = params[0];
      return Promise.resolve(mockUsers.find(user => user.email === email));
    }
    return Promise.resolve(null);
  })
};

// Test user information
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// Create a test app for auth routes
const createTestApp = () => {
  const app = express();
  
  // Set up middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));
  
  // Set up mock database
  global.db = mockDb;
  
  // Set up auth routes
  app.use('/auth', authRouter);
  
  // Add a test protected route
  app.get('/3', (req, res) => {
    if (!req.session.isAuthenticated) {
      req.session.returnTo = '/3';
      return res.status(401).json({ error: 'Authentication required' });
    }
    res.json({ success: true });
  });
  
  return app;
};

describe('Authentication API (Mocked)', () => {
  let app;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Create a fresh app for each test
    app = createTestApp();
  });
  
  describe('POST /auth/signin', () => {
    it('should return 401 with error message for invalid email', async () => {
      // Setup mock to return no user
      mockDb.get.mockResolvedValueOnce(null);
      
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
    });
    
    it('should return 401 with error message for invalid password', async () => {
      // Setup mock to return the user but with wrong password verification
      mockDb.get.mockResolvedValueOnce(mockUsers[0]);
      
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
    });
    
    it('should return 200 and set session for valid credentials', async () => {
      // Setup mock to return user and correct password verification
      mockDb.get.mockResolvedValueOnce(mockUsers[0]);
      
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
    });
    
    it('should return the original requested URL after successful login', async () => {
      // Create an agent to preserve session
      const agent = request.agent(app);
      
      // First hit protected route to set returnTo
      await agent.get('/3');
      
      // Setup mock to return user for sign in attempt
      mockDb.get.mockResolvedValueOnce(mockUsers[0]);
      
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
      // Create an agent to preserve session
      const agent = request.agent(app);
      
      // Setup mock to return user for sign in attempt
      mockDb.get.mockResolvedValueOnce(mockUsers[0]);
      
      // Sign in to create an authenticated session
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
