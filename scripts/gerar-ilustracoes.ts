/**
 * Emite `demo/ilustracoes.js` a partir de `src/lib/ilustracoes.ts`.
 *
 * A vitrine é HTML estático servido sem bundler, então não consegue importar o
 * módulo TypeScript. Copiar as ilustrações à mão criaria duas fontes que
 * divergem na primeira alteração; gerar no build mantém uma só.
 *
 * Roda como parte de `npm run demo:build`.
 */
import { writeFileSync } from 'node:fs'
import { ILUSTRACOES } from '../src/lib/ilustracoes'

const conteudo = `/* Gerado por scripts/gerar-ilustracoes.ts — não editar à mão.
   A fonte é src/lib/ilustracoes.ts. */
const ILUSTRACOES = ${JSON.stringify(
  Object.fromEntries(Object.entries(ILUSTRACOES).map(([k, v]) => [k, v.path])),
  null,
  2,
)}
`

writeFileSync('demo/ilustracoes.js', conteudo)
console.log(`demo/ilustracoes.js: ${Object.keys(ILUSTRACOES).length} ilustrações`)
