// jest.config.js
module.exports = {
  // Use jsdom as the default test environment
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    'public/js/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js'
  },
  // Setup files run before each test file
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Set testEnvironment to jsdom explicitly for those tests using DOM APIs
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  }
};
