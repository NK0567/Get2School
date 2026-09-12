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
      globals: globals.browser,
    },
  },
  {
    // Ces fichiers exportent volontairement autre chose que des composants :
    // tables de routes, hook de toast. La regle de rafraichissement rapide
    // ne s'y applique pas.
    files: ['src/routes/**/*.tsx', 'src/ui/Toast.tsx', 'src/communs/**/*.ts'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
