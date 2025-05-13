import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { UserModel } from '../models/user';

export function createAuthRoutes(userModel: UserModel): Router {
  const router = Router();
  const authController = new AuthController(userModel);
  
  // Sign in route
  router.post('/signin', (req, res) => authController.signin(req, res));
  
  // Sign out route
  router.post('/signout', (req, res) => authController.signout(req, res));
  
  // Forgot password route
  router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
  
  return router;
}
