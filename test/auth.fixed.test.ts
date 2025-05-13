import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../src/models/user';
import { AuthMiddleware } from '../src/middleware/auth';

// Mock objects
const mockRequest = () => {
  return {
    session: {} as any,
    cookies: {},
    headers: {},
    body: {},
    signedCookies: {},
    url: '/invoices/3',
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

describe('Authentication Tests', () => {
  describe('AuthMiddleware', () => {
    let req: Request;
    let res: Response;
    let next: NextFunction;
    let authMiddleware: AuthMiddleware;
    let userModel: UserModel;

    beforeEach(() => {
      req = mockRequest();
      res = mockResponse();
      next = mock(() => {});
      userModel = new UserModel();
      authMiddleware = new AuthMiddleware(userModel);
    });

    it('should allow access to protected routes for authenticated users', async () => {
      // Setup request with valid session
      req.session.authenticated = true;
      req.session.userId = 1;
      req.session.lastActivity = Date.now();
      
      await authMiddleware.requireAuth(req, res, next);
      
      // Should call next() without rendering signin form
      expect(next).toHaveBeenCalled();
      expect(res.render).not.toHaveBeenCalled();
    });

    it('should show sign-in overlay for unauthenticated users', async () => {
      // No session or not authenticated
      req.session.authenticated = false;
      
      await authMiddleware.requireAuth(req, res, next);
      
      // Should render signin form
      expect(res.render).toHaveBeenCalledWith('partials/signin', { layout: false });
      expect(next).not.toHaveBeenCalled();
    });

    it('should refresh session activity timestamp on each request', async () => {
      // Setup request with valid but old session
      req.session.authenticated = true;
      req.session.userId = 1;
      const oldTimestamp = Date.now() - 1000000; // old timestamp
      req.session.lastActivity = oldTimestamp;
      
      await authMiddleware.requireAuth(req, res, next);
      
      // Should update lastActivity
      expect(req.session.lastActivity).not.toBe(oldTimestamp);
      expect(req.session.lastActivity).toBeGreaterThan(oldTimestamp);
      expect(next).toHaveBeenCalled();
    });

    it('should expire session after 30 minutes of inactivity', async () => {
      // Setup request with expired session (31 minutes old)
      req.session.authenticated = true;
      req.session.userId = 1;
      req.session.lastActivity = Date.now() - 31 * 60 * 1000;
      
      await authMiddleware.requireAuth(req, res, next);
      
      // Should clear session and render signin form
      expect(req.session.authenticated).toBe(false);
      expect(res.render).toHaveBeenCalledWith('partials/signin', { layout: false });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
