// ESLint 10 flat config (migrated from .eslintrc.js).
// Uses the typescript-eslint v8 helper plus flat presets for react / react-hooks.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'dist',
      'release',
      'scripts',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.main.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Bug-catching rules stay as errors (see below). The next two are
      // opinionated/stylistic: `??` vs `||` changes falsy semantics and
      // strict-boolean is highly pedantic — kept as warnings for gradual,
      // behavior-preserving cleanup rather than a risky mass rewrite.
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        { allowString: true, allowNumber: true, allowNullableObject: true },
      ],
      // require-await is stylistic (async kept for interface consistency).
      '@typescript-eslint/require-await': 'warn',
      // Genuine bug-risk rules — keep as errors.
      '@typescript-eslint/no-floating-promises': 'error',
      // Empty IPC request DTOs (`interface FooRequest {}`) are an intentional
      // no-payload marker pattern — warn, don't error.
      '@typescript-eslint/no-empty-object-type': 'warn',
      // Empty catch blocks are mostly intentional best-effort cleanup; kept as
      // a warning. TODO: add logging to the genuine swallows (see review notes).
      'no-empty': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      // Brace style is cosmetic; keep as a warning to avoid a risky mass autofix.
      curly: ['warn', 'all'],
    },
  },
);
