module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier', 'react', 'import'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  extends: [
    '@react-native-community',
    'airbnb-typescript',
    'prettier',
    'plugin:jest/recommended'
  ],
  rules: {
    'no-console': 1, // Means warning
    'no-unused-vars': 1, // Means warning
    '@typescript-eslint/no-unused-vars': 1, // Means warning
    'prettier/prettier': 2, // Means error
    "react/react-in-jsx-scope": "off",
    "react-hooks/exhaustive-deps": 1,
    "radix": "off"
  }
};
