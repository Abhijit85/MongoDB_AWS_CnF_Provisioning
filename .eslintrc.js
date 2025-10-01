module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'import', 'jsdoc'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:jsdoc/recommended',
    'prettier',
  ],
  env: {
    node: true,
    es2021: true,
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'import/order': [
      'error',
      {
        groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'jsdoc/require-jsdoc': [
      'error',
      {
        contexts: [
          'ClassDeclaration',
          'MethodDefinition',
          'FunctionDeclaration',
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
