import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { CATALOGO_AUVP, slugDoProduto } from '../prisma/catalogo-auvp'

/**
 * Converte as fotos que a área subiu em `imgs produtos/` para o formato que o
 * catálogo serve.
 *
 * As originais vêm como o fornecedor mandou: JPEG, PNG, WebP e HEIC, de 0,55 a
 * 1,33 de proporção, com peso de foto de celular. O catálogo mostra todas na
 * mesma moldura 3:4, então elas saem daqui normalizadas — mesma proporção,
 * mesmo formato, mesmo peso — e a grade deixa de parecer uma colagem.
 *
 * O recorte é `cover`, e não `contain`: só dez das quarenta e nove estão sobre
 * fundo branco. As outras são fotos com cenário, e barra branca em volta de
 * foto escura fica pior do que cortar um pedaço da borda.
 *
 * Roda uma vez, quando a área trocar ou acrescentar foto:
 *
 * ```
 * npm run fotos:preparar
 * ```
 */

const ORIGEM = 'imgs produtos'
const DESTINO = 'public/produtos'

/** A moldura do catálogo, em `src/components/produto-imagem.tsx`. */
const LARGURA = 900
const ALTURA = 1200

const chave = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

async function main() {
  const arquivos = fs.readdirSync(ORIGEM).filter((f) => !f.startsWith('.'))
  const porChave = new Map(arquivos.map((f) => [chave(f.replace(/\.[^.]+$/, '')), f]))

  fs.mkdirSync(DESTINO, { recursive: true })

  const usados = new Set<string>()
  const falhas: { nome: string; motivo: string }[] = []
  let feitas = 0

  for (const produto of CATALOGO_AUVP) {
    const alvo = chave(produto.nome)

    // O nome do arquivo às vezes é mais curto que o do produto: a planilha traz
    // "- Escolha o vinho" no fim, e a foto não.
    const arquivo =
      porChave.get(alvo) ??
      [...porChave.entries()].find(([k]) => alvo.startsWith(k) || k.startsWith(alvo))?.[1]

    if (!arquivo) {
      falhas.push({ nome: produto.nome, motivo: 'sem arquivo correspondente' })
      continue
    }
    usados.add(arquivo)

    const saida = path.join(DESTINO, `${slugDoProduto(produto.nome)}.webp`)
    try {
      const original = sharp(path.join(ORIGEM, arquivo))
      const { width = 0, height = 0 } = await original.metadata()

      // Foto larga perde muito no recorte central; `attention` procura a região
      // com mais informação, que numa foto de produto é o produto.
      const recorte = width / height > 1.05 ? sharp.strategy.attention : 'centre'

      await original
        .resize(LARGURA, ALTURA, { fit: 'cover', position: recorte })
        .webp({ quality: 82 })
        .toFile(saida)

      feitas++
      const kb = Math.round(fs.statSync(saida).size / 1024)
      console.log(`  ✓ ${produto.nome} → ${path.basename(saida)} (${kb} KB)`)
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message.split('\n')[0]! : String(erro)
      falhas.push({ nome: produto.nome, motivo: `${arquivo}: ${motivo}` })
      console.log(`  × ${produto.nome} — ${motivo}`)
    }
  }

  console.log(`\n${feitas} de ${CATALOGO_AUVP.length} fotos preparadas em ${DESTINO}/`)

  const sobrando = arquivos.filter((f) => !usados.has(f))
  if (sobrando.length > 0) {
    console.log(`\nArquivos sem produto correspondente (${sobrando.length}):`)
    for (const f of sobrando) console.log(`  · ${f}`)
  }

  if (falhas.length > 0) {
    console.log(`\nSem foto (${falhas.length}):`)
    for (const f of falhas) console.log(`  · ${f.nome} — ${f.motivo}`)
    console.log('\nEsses produtos aparecem com a ilustração da categoria, não com um quadro vazio.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
