/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/components/__tests__', '<rootDir>/hooks/__tests__'],
  testMatch: ['**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^expo-crypto$': '<rootDir>/lib/__mocks__/expo-crypto',
    '^expo-secure-store$': '<rootDir>/lib/__mocks__/expo-secure-store',
    '^expo-file-system/legacy$': '<rootDir>/lib/__mocks__/expo-file-system',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|uuid)',
  ],
};
