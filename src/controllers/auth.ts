import { Request, Response } from 'express';
import { UserModel } from '../models/user';

export class AuthController {
  private userModel: UserModel;
  
  constructor(userModel: UserModel) {
    this.userModel = userModel;
  }
  
  /**
   * Handle user sign-in requests
   */
  async signin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }
    
    try {
      // Authenticate user
      const authResult = await this.userModel.authenticate(email, password);
      
      if (authResult.success) {
        // Set up session
        req.session.authenticated = true;
        req.session.userId = authResult.user?.id;
        req.session.lastActivity = Date.now();
        
        // Set secure cookie
        res.cookie('session', req.sessionID, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 30 * 60 * 1000 // 30 minutes
        });
        
        res.status(200).json({
          success: true,
          message: authResult.message
        });
      } else {
        res.status(401).json({
          success: false,
          message: authResult.message
        });
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during sign-in'
      });
    }
  }
  
  /**
   * Handle user sign-out requests
   */
  async signout(req: Request, res: Response): Promise<void> {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      
      res.clearCookie('session');
      res.redirect('/');
    });
  }
  
  /**
   * Handle forgot password requests
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    
    // Note: For security reasons, always return the same response
    // regardless of whether the email exists in the system
    
    // In a real implementation, we would:
    // 1. Check if the email exists in the database
    // 2. Generate a password reset token
    // 3. Send an email with a reset link
    
    res.status(200).json({
      success: true,
      message: 'If the email exists, password reset instructions have been sent'
    });
  }
}
