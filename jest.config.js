/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib', '<rootDir>/constants'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^expo-crypto$': '<rootDir>/lib/__mocks__/expo-crypto',
    '^expo-secure-store$': '<rootDir>/lib/__mocks__/expo-secure-store',
    '^expo-file-system/legacy$': '<rootDir>/lib/__mocks__/expo-file-system',
    '^@noble/ciphers/(.*)$': '@noble/ciphers/$1.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@noble/ciphers)/)',
  ],
  transform: {
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
          strict: true,
          esModuleInterop: true,
          allowJs: true,
          moduleResolution: 'node',
          paths: {
            '@/*': ['./*'],
            '@noble/ciphers/*': ['./node_modules/@noble/ciphers/*'],
          },
        },
      },
    ],
  },
};
