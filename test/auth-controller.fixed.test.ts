import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { Request, Response } from 'express';
import { AuthController } from '../src/controllers/auth';
import { UserModel } from '../src/models/user';

// Mock objects
const mockRequest = () => {
  return {
    session: {} as any,
    cookies: {},
    body: {},
    signedCookies: {},
    headers: {},
    get: mock(() => {})
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Partial<Response>;
  res.status = mock((code: number) => res as Response);
  res.json = mock((data: any) => res as Response);
  res.render = mock((view: string, options?: any) => res as Response);
  res.cookie = mock((name: string, value: any, options?: any) => res as Response);
  res.clearCookie = mock((name: string) => res as Response);
  res.redirect = mock((url: string) => res as Response);
  return res as Response;
};

describe('Auth Controller Tests', () => {
  let req: Request;
  let res: Response;
  let userModel: UserModel;
  let authController: AuthController;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    userModel = new UserModel();
    authController = new AuthController(userModel);

    // Mock userModel.authenticate to control test cases
    userModel.authenticate = mock(async (email: string, password: string) => {
      if (email === 'valid@example.com' && password === 'correct_password') {
        return {
          success: true,
          user: {
            id: 1,
            email: 'valid@example.com'
          },
          message: 'Authentication successful'
        };
      } else {
        return {
          success: false,
          message: 'Email or password is incorrect'
        };
      }
    });
  });

  describe('signin', () => {
    it('should successfully authenticate with valid credentials', async () => {
      req.body = {
        email: 'valid@example.com',
        password: 'correct_password'
      };
      
      await authController.signin(req, res);
      
      // Session should be set up
      expect(req.session.authenticated).toBe(true);
      expect(req.session.userId).toBe(1);
      expect(req.session.lastActivity).toBeDefined();
      
      // Response should indicate success
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Authentication successful'
      });
    });

    it('should reject invalid credentials', async () => {
      req.body = {
        email: 'valid@example.com',
        password: 'wrong_password'
      };
      
      await authController.signin(req, res);
      
      // Session should not be set up
      expect(req.session.authenticated).toBeUndefined();
      expect(req.session.userId).toBeUndefined();
      
      // Response should indicate failure
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: 'Email or password is incorrect'
      });
    });

    it('should handle empty credentials', async () => {
      req.body = {
        email: '',
        password: ''
      };
      
      await authController.signin(req, res);
      
      // Response should indicate failure
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: 'Email and password are required'
      });
    });

    it('should set secure HttpOnly cookie with proper attributes', async () => {
      req.body = {
        email: 'valid@example.com',
        password: 'correct_password'
      };
      
      await authController.signin(req, res);
      
      // Should set session cookie with proper attributes
      expect(res.cookie).toHaveBeenCalledWith('session', expect.any(String), {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
    });
  });

  describe('signout', () => {
    it('should destroy the session and clear cookies', async () => {
      req.session.destroy = mock((callback: (err: any) => void) => callback(null));
      
      await authController.signout(req, res);
      
      // Should destroy session
      expect(req.session.destroy).toHaveBeenCalled();
      
      // Should clear cookies
      expect(res.clearCookie).toHaveBeenCalledWith('session');
      
      // Should redirect to home
      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset without changing the URL', async () => {
      req.body = {
        email: 'valid@example.com'
      };
      
      await authController.forgotPassword(req, res);
      
      // Should respond with success message regardless of whether email exists
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'If the email exists, password reset instructions have been sent'
      });
    });
  });
});
