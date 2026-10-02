import eslintPluginReact from 'eslint-plugin-react'

// CSS is not linted by ESLint (it has no JS semantics to check).
const cssIgnores = {
  ignores: ['**/*.css', '**/*.css.ts', 'dist', 'node_modules', 'scripts'],
}
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  cssIgnores,
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    settings: {
      react: { version: '18' },
    },
    plugins: {
      'react-hooks': eslintPluginReactHooks,
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.es2023 },
    },
  },
)