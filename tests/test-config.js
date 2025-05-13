// Set up for testing
const { TextEncoder, TextDecoder } = require('util');
const crypto = require('crypto');

// Set global TextEncoder and TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Create a mock database for testing
const mockDb = {
  users: [
    {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password_hash: '7a9c1085d17841ff98775b16aad51c92ff2a9b7acb0ab82202b867773530f5402735da27ef5e74fe7ae8a7536c76a1e17933f0d555b28413c51c911c97f797d7',
      password_salt: '0123456789abcdef'
    }
  ],
  get: function(query, params) {
    if (query.includes('SELECT * FROM users WHERE email = ?')) {
      const email = params[0];
      return Promise.resolve(this.users.find(user => user.email === email) || null);
    }
    return Promise.resolve(null);
  },
  run: function() {
    return Promise.resolve({ lastID: 1, changes: 1 });
  },
  all: function() {
    return Promise.resolve([]);
  }
};

// Function to verify password (must match the one in auth.js)
function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Pre-compute the password hash for the test user
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// Set the correct password hash for the test user
const passwordData = (() => {
  const salt = '0123456789abcdef';
  const hash = crypto.pbkdf2Sync(testUser.password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
})();

// Update the mock user with the correct password hash and salt
mockDb.users[0].password_hash = passwordData.hash;
mockDb.users[0].password_salt = passwordData.salt;

// Set the mock db as global.db
global.db = mockDb;

// Verify that the test password works with our mock user
const testUserInDb = mockDb.users.find(user => user.email === testUser.email);
console.log('Test user verification:', verifyPassword(testUser.password, testUserInDb.password_hash, testUserInDb.password_salt));

module.exports = {
  testUser,
  mockDb
};
