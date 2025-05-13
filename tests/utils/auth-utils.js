// Test utilities for FinanceFlux
const crypto = require('crypto');

/**
 * Creates a password hash and salt for testing
 * @param {string} password - The plain password to hash
 * @returns {Object} Object containing hash and salt
 */
function createPasswordHash(password, salt = null) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

/**
 * Verifies a password against a hash and salt
 * @param {string} password - The plain password to verify
 * @param {string} hash - The stored password hash
 * @param {string} salt - The salt used for hashing
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Creates a test user object for mocking
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Object} A test user object
 */
function createTestUser(overrides = {}) {
  const defaultEmail = 'test@example.com';
  const defaultPassword = 'password123';
  
  // Create password hash
  const salt = '0123456789abcdef';
  const { hash } = createPasswordHash(overrides.password || defaultPassword, salt);
  
  return {
    id: 1,
    email: overrides.email || defaultEmail,
    name: overrides.name || 'Test User',
    password_hash: hash,
    password_salt: salt,
    ...overrides
  };
}

/**
 * Tests the password verification logic
 */
function testPasswordVerification() {
  const password = 'password123';
  const { hash, salt } = createPasswordHash(password);
  
  console.log('Password:', password);
  console.log('Salt:', salt);
  console.log('Hash:', hash);
  console.log('Verification result:', verifyPassword(password, hash, salt));
  console.log('Wrong password result:', verifyPassword('wrong', hash, salt));
}

module.exports = {
  createPasswordHash,
  verifyPassword,
  createTestUser,
  testPasswordVerification
};
