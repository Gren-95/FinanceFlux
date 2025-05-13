// Mock database for testing
const mockUsers = [
  {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password_hash: '7a9c1085d17841ff98775b16aad51c92ff2a9b7acb0ab82202b867773530f5402735da27ef5e74fe7ae8a7536c76a1e17933f0d555b28413c51c911c97f797d7',
    password_salt: '0123456789abcdef'
  }
];

// Mock get function to retrieve users
const get = jest.fn().mockImplementation((query, params) => {
  if (query.includes('SELECT * FROM users WHERE email = ?')) {
    const email = params[0];
    return Promise.resolve(mockUsers.find(user => user.email === email) || null);
  }
  return Promise.resolve(null);
});

// Mock run function for other database operations
const run = jest.fn().mockResolvedValue({ lastID: 1, changes: 1 });

// Mock all function for retrieving multiple rows
const all = jest.fn().mockResolvedValue([]);

// Export mock database functions
module.exports = {
  get,
  run,
  all
};
