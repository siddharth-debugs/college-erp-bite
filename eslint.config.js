import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])


// | Line / Section                                                     | What It Does                                  | Why It’s Used                                                          |
// | ------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------- |
// | `import js from '@eslint/js'`                                      | Imports ESLint’s standard JavaScript config   | Provides base JS linting rules                                         |
// | `import globals from 'globals'`                                    | Provides a list of common JS/global variables | To avoid ESLint errors for browser globals like `window` or `document` |
// | `import reactHooks from 'eslint-plugin-react-hooks'`               | Plugin for React Hooks rules                  | Ensures hooks rules (like `useEffect` dependencies) are followed       |
// | `import reactRefresh from 'eslint-plugin-react-refresh'`           | Plugin for Vite’s React Fast Refresh          | Detects issues that could break Hot Module Replacement (HMR)           |
// | `import tseslint from 'typescript-eslint'`                         | TypeScript ESLint plugin                      | Enables linting for `.ts` and `.tsx` files                             |
// | `import { defineConfig, globalIgnores } from 'eslint/config'`      | Helper functions to define ESLint config      | Modern ESLint syntax for structured configs                            |
// | `export default defineConfig([...])`                               | Defines and exports the ESLint config         | Makes ESLint use this configuration                                    |
// | `globalIgnores(['dist'])`                                          | Ignores `dist` folder globally                | Built code doesn’t need linting                                        |
// | `files: ['**/*.{ts,tsx}']`                                         | ESLint should check all TS and TSX files      | Focused linting on your source code                                    |
// | `extends: [...]`                                                   | Extends recommended rule sets                 | Combines base JS, TypeScript, React Hooks, and Vite-specific rules     |
// | `languageOptions: { ecmaVersion: 2020, globals: globals.browser }` | Sets ECMAScript version and browser globals   | Supports modern JS syntax + avoids errors for browser variables        |


// ✅ Summary

// Main purpose: Enforce consistent code quality and catch errors early in TypeScript + React + Vite projects.

// Special features:

// Supports TypeScript linting via typescript-eslint

// Supports React Hooks best practices

// Supports Vite fast-refresh integration

// Ignores built files to speed up linting

// Helps catch bugs before runtime and enforce coding standards across your project.