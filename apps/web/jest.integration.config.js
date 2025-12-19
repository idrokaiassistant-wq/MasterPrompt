const nextJest = require('next/jest');
const path = require('path');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node', // Integration tests often run in node env for API
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
};

module.exports = createJestConfig(customJestConfig);
