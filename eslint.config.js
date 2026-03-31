import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import chaiFriendly from 'eslint-plugin-chai-friendly';

const consoleLogRule = process.env.NODE_ENV === 'production' ? ['error', { allow: ['warn', 'error'] }] : ['warn'];

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'no-only-tests': noOnlyTests,
      'chai-friendly': chaiFriendly,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
        ...globals.es2021,
      },
      parserOptions: {
        sourceType: 'module',
      },
    },
    rules: {
      // Rules from @enspirit/eslint-config-node
      'prefer-template': 'warn',
      'template-curly-spacing': ['error', 'never'],
      'curly': 'error',
      'prefer-arrow-callback': 'warn',
      'no-useless-escape': 'warn',
      'eqeqeq': 'error',
      'no-multi-spaces': ['warn', {
        exceptions: {
          'Property': true,
          'VariableDeclarator': true,
          'ImportDeclaration': true,
        },
      }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'no-var': ['error'],
      'prefer-const': ['error'],
      'no-console': consoleLogRule,
      'no-debugger': 'error',
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'chai-friendly/no-unused-expressions': ['error'],
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      }],
      'space-before-blocks': ['error', 'always'],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-infix-ops': ['error', { int32Hint: false }],
      'space-in-parens': ['error', 'never'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-const-assign': ['error'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-only-tests/no-only-tests': process.env.NODE_ENV === 'test' ? 'error' : 'warn',

      // TypeScript overrides
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
