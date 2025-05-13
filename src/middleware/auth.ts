import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user';

export class AuthMiddleware {
  private userModel: UserModel;
  
  constructor(userModel: UserModel) {
    this.userModel = userModel;
  }
  
  /**
   * Middleware to check if user is authenticated
   * If not, renders the sign-in overlay
   */
  async requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if session exists and is authenticated
    if (req.session?.authenticated) {
      // Check if session has expired (30 minutes of inactivity)
      const lastActivity = req.session.lastActivity || 0;
      const now = Date.now();
      const inactivityPeriod = now - lastActivity;
      const maxInactivity = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      if (inactivityPeriod > maxInactivity) {
        // Session expired, clear it and show sign-in overlay
        req.session.authenticated = false;
        res.render('partials/signin', { layout: false });
        return;
      }
      
      // Update last activity timestamp
      req.session.lastActivity = now;
      
      // User is authenticated, allow access to protected route
      next();
    } else {
      // User is not authenticated, show sign-in overlay
      res.render('partials/signin', { layout: false });
    }
  }
}
