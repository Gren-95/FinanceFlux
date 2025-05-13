import { Database } from 'sqlite';

export interface User {
  id: number;
  email: string;
  // Other user properties would go here
}

export interface AuthResult {
  success: boolean;
  user?: User;
  message: string;
}

export class UserModel {
  private db: Database | null;

  constructor(db: Database | null = null) {
    this.db = db;
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Get user by email
      const user = await this.db.get(
        'SELECT * FROM users WHERE email = ?',
        email
      );

      // Check if user exists
      if (!user) {
        return {
          success: false,
          message: 'Email or password is incorrect'
        };
      }

      // Check if account is locked
      if (user.locked_until && user.locked_until > Date.now()) {
        return {
          success: false,
          message: 'Account locked. Try again after 15 minutes.'
        };
      }

      // Verify password
      const passwordMatch = await Bun.password.verify(password, user.password_hash);

      if (passwordMatch) {
        // Reset failed attempts on successful login
        await this.db.run(
          'UPDATE users SET failed_attempts = 0, last_failed_attempt = NULL, locked_until = NULL WHERE id = ?',
          user.id
        );

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email
          },
          message: 'Authentication successful'
        };
      } else {
        // Increment failed attempts
        const newFailedAttempts = (user.failed_attempts || 0) + 1;
        const now = Date.now();

        // Check if we need to lock the account (5 failures within 10 minutes)
        let lockedUntil = null;
        if (newFailedAttempts >= 5) {
          // Check if failures happened within 10 minutes
          const tenMinutesAgo = now - 10 * 60 * 1000;
          if (!user.last_failed_attempt || user.last_failed_attempt > tenMinutesAgo) {
            // Lock account for 15 minutes
            lockedUntil = now + 15 * 60 * 1000;
          }
        }

        // Update user record with new failed attempt
        await this.db.run(
          'UPDATE users SET failed_attempts = ?, last_failed_attempt = ?, locked_until = ? WHERE id = ?',
          newFailedAttempts, now, lockedUntil, user.id
        );

        return {
          success: false,
          message: lockedUntil 
            ? 'Account locked. Try again after 15 minutes.' 
            : 'Email or password is incorrect'
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        message: 'Authentication failed. Please try again.'
      };
    }
  }
}
