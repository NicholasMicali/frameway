import tsParser from '@typescript-eslint/parser';

export default [
  { ignores: ['node_modules/**', 'dist/**', 'release/**', 'tools/**', 'test-results/**', 'playwright-report/**', 'evidence/**', 'recordings/**', 'exports/**'] },
  {
    files: ['src/**/*.{js,ts,tsx}', 'extension/**/*.ts', 'scripts/**/*.mjs', 'tests/**/*.{mjs,ts}', '*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-debugger': 'error',
      'no-constant-binary-expression': 'error',
      'no-dupe-args': 'error',
      'no-duplicate-case': 'error',
      'no-fallthrough': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-optional-chaining': 'error',
      'valid-typeof': 'error',
    },
  },
  { files: ['**/*.{ts,tsx}'], languageOptions: { parser: tsParser } },
];
