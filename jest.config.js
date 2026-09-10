module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 20000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary', 'clover'],
  collectCoverageFrom: [
    'src/domain/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/screens/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/components/animated-icon*',
    '!src/components/app-tabs*',
    '!src/components/external-link*',
    '!src/components/hint-row*',
    '!src/components/themed-*',
    '!src/components/web-badge*',
    '!src/components/ui/**',
    '!src/hooks/use-color-scheme*',
    '!src/hooks/use-theme*',
  ],
};
