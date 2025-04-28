module.exports = {
  ...require('../../jest.config.base.js'),
  roots: ['<rootDir>/src'],
  displayName: 'cli',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}; 