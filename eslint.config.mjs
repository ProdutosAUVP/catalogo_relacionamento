import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    // next-env.d.ts é gerado pelo Next e não deve ser editado nem lintado.
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // A vitrine é feita de scripts de navegador carregados por <script>, sem
    // módulos nem build: as constantes de dados.js são globais consumidas por
    // app.js, e não exportações não utilizadas.
    files: ['demo/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        document: 'readonly',
        window: 'readonly',
        CATEGORIAS: 'readonly',
        PRODUTOS: 'readonly',
        SOLICITACOES: 'readonly',
        STATUS: 'readonly',
        CONSULTORES: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]

export default config
