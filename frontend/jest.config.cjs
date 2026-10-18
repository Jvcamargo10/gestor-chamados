/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }] },
  moduleNameMapper: {
    '^@dominio/(.*)$': '<rootDir>/../backend/src/dominio/$1',
    '\\.css$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
};
