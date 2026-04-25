// jest.setup.js
// Global test setup

process.env.JWT_SECRET = 'test-secret-key-for-testing'
process.env.NODE_ENV = 'test'

require('@testing-library/jest-dom')
