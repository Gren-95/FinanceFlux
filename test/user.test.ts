import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { UserModel } from '../src/models/user';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

describe('User Model Tests', () => {
  let userModel: UserModel;
  let db: any;
  
  beforeAll(async () => {
    // Set up in-memory test database
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    });
    
    // Create test schema
    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        failed_attempts INTEGER DEFAULT 0,
        last_failed_attempt INTEGER,
        locked_until INTEGER
      );
    `);
    
    // Insert test user
    await db.exec(`
      INSERT INTO users (email, password_hash) 
      VALUES ('test@example.com', '${await Bun.password.hash("correct_password")}');
    `);
    
    userModel = new UserModel(db);
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Reset failed attempts before each test
    await db.exec(`
      UPDATE users 
      SET failed_attempts = 0, 
          last_failed_attempt = NULL, 
          locked_until = NULL 
      WHERE email = 'test@example.com';
    `);
  });

  describe('authenticate', () => {
    it('should return user data for valid credentials', async () => {
      const result = await userModel.authenticate('test@example.com', 'correct_password');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.message).toBe('Authentication successful');
    });

    it('should fail with invalid password', async () => {
      const result = await userModel.authenticate('test@example.com', 'wrong_password');
      
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.message).toBe('Email or password is incorrect');
    });

    it('should fail with non-existent email', async () => {
      const result = await userModel.authenticate('nonexistent@example.com', 'any_password');
      
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.message).toBe('Email or password is incorrect');
    });

    it('should increment failed attempts on invalid credentials', async () => {
      // First failed attempt
      await userModel.authenticate('test@example.com', 'wrong_password');
      
      const user = await db.get('SELECT failed_attempts FROM users WHERE email = ?', 'test@example.com');
      expect(user.failed_attempts).toBe(1);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Set up 4 failed attempts
      await db.exec(`
        UPDATE users 
        SET failed_attempts = 4,
            last_failed_attempt = ${Date.now()}
        WHERE email = 'test@example.com';
      `);
      
      // 5th failed attempt should lock the account
      const result = await userModel.authenticate('test@example.com', 'wrong_password');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Account locked. Try again after 15 minutes.');
      
      const user = await db.get('SELECT locked_until FROM users WHERE email = ?', 'test@example.com');
      expect(user.locked_until).toBeGreaterThan(Date.now());
      expect(user.locked_until).toBeLessThanOrEqual(Date.now() + 15 * 60 * 1000);
    });

    it('should reset failed attempts after successful login', async () => {
      // Set up 2 failed attempts
      await db.exec(`
        UPDATE users 
        SET failed_attempts = 2,
            last_failed_attempt = ${Date.now()}
        WHERE email = 'test@example.com';
      `);
      
      // Successful login should reset counter
      await userModel.authenticate('test@example.com', 'correct_password');
      
      const user = await db.get('SELECT failed_attempts FROM users WHERE email = ?', 'test@example.com');
      expect(user.failed_attempts).toBe(0);
    });

    it('should reject login attempts on a locked account', async () => {
      // Set account to locked for 15 minutes
      const lockUntil = Date.now() + 15 * 60 * 1000;
      await db.exec(`
        UPDATE users 
        SET failed_attempts = 5,
            last_failed_attempt = ${Date.now()},
            locked_until = ${lockUntil}
        WHERE email = 'test@example.com';
      `);
      
      // Even with correct password, login should be rejected
      const result = await userModel.authenticate('test@example.com', 'correct_password');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Account locked. Try again after 15 minutes.');
    });

    it('should allow login after lock period expires', async () => {
      // Set account to locked but with expired lock time
      const expiredLock = Date.now() - 1000; // 1 second ago
      await db.exec(`
        UPDATE users 
        SET failed_attempts = 5,
            last_failed_attempt = ${Date.now() - 16 * 60 * 1000},
            locked_until = ${expiredLock}
        WHERE email = 'test@example.com';
      `);
      
      // Login should succeed and reset counters
      const result = await userModel.authenticate('test@example.com', 'correct_password');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Authentication successful');
      
      const user = await db.get('SELECT failed_attempts, locked_until FROM users WHERE email = ?', 'test@example.com');
      expect(user.failed_attempts).toBe(0);
      expect(user.locked_until).toBeNull();
    });
  });
});
