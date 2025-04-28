module.exports = {
  ...require('../../jest.config.base.js'),
  roots: ['<rootDir>/src'],
  displayName: 'core',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}; 