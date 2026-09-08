/**
 * Emite os assets que a vitrine estática precisa e que vivem fora dela:
 * `demo/ilustracoes.js`, `demo/icones.js` e as fotos de produto.
 *
 * A vitrine é HTML servido sem bundler, então não consegue importar
 * `src/lib/ilustracoes.ts` nem `lucide-react`. Copiar à mão criaria duas fontes
 * que divergem na primeira alteração; gerar no build mantém uma só.
 *
 * Roda como parte de `npm run demo:build`.
 */
import { cpSync, readFileSync, writeFileSync } from 'node:fs'
import { ILUSTRACOES } from '../src/lib/ilustracoes'

// --- ilustrações -----------------------------------------------------------
writeFileSync(
  'demo/ilustracoes.js',
  `/* Gerado por scripts/gerar-assets-vitrine.ts — não editar à mão.
   A fonte é src/lib/ilustracoes.ts. */
const ILUSTRACOES = ${JSON.stringify(
    Object.fromEntries(Object.entries(ILUSTRACOES).map(([k, v]) => [k, v.path])),
    null,
    2,
  )}
`,
)

// --- ícones ----------------------------------------------------------------
/**
 * Extrai o traçado dos ícones do lucide direto do pacote instalado, para que a
 * vitrine use exatamente os mesmos desenhos da aplicação e da Central.
 */
const ICONES: Record<string, string> = {
  'layout-grid': 'todos',
  'cup-soda': 'canecas e garrafas',
  shirt: 'vestuário',
  'notebook-pen': 'papelaria',
  gem: 'acessórios',
  wine: 'bebidas',
  house: 'casa & mesa',
  boxes: 'sacolas & caixas',
  package: 'padrao',
  'rotate-cw': 'girar',
}

const svgs: Record<string, string> = {}

for (const [arquivo, chave] of Object.entries(ICONES)) {
  const fonte = readFileSync(`node_modules/lucide-react/dist/esm/icons/${arquivo}.js`, 'utf8')
  // Traçado longo vem quebrado em várias linhas no pacote, então o casamento
  // precisa atravessar quebras de linha.
  const nos = [...fonte.matchAll(/\[\s*"(\w+)",\s*\{([\s\S]*?)\}\s*\]/g)]

  const markup = nos
    .map(([, tag, atributos]) => {
      const pares = [...atributos!.matchAll(/(\w[\w-]*):\s*"([^"]*)"/g)]
        .filter(([, nome]) => nome !== 'key')
        .map(([, nome, valor]) => `${nome}="${valor}"`)
        .join(' ')
      return `<${tag} ${pares} />`
    })
    .join('')

  if (!markup) throw new Error(`Ícone sem traçado: ${arquivo}`)
  svgs[chave] = markup
}

writeFileSync(
  'demo/icones.js',
  `/* Gerado por scripts/gerar-assets-vitrine.ts — não editar à mão.
   Os traçados vêm do pacote lucide-react instalado. */
const ICONES = ${JSON.stringify(svgs, null, 2)}
`,
)

console.log(
  `demo/ilustracoes.js: ${Object.keys(ILUSTRACOES).length} ilustrações · demo/icones.js: ${Object.keys(svgs).length} ícones`,
)

// --- fotos de produto ------------------------------------------------------
// Copiadas de `public/produtos`, e não versionadas duas vezes: são ~750 KB que
// não devem existir em dois lugares do repositório para divergirem depois.
cpSync('public/produtos', 'demo/produtos', { recursive: true })

console.log('demo/produtos: fotos copiadas de public/produtos')
