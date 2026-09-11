import { db } from './db'

/**
 * Fotos de produto.
 *
 * O arquivo é gravado no Postgres, e não num bucket. A spec previa S3 e o
 * `env` reserva as variáveis, mas o V1 tem algumas dezenas de fotos e a área
 * precisa cadastrar produto no dia em que a ferramenta subir, esperar bucket
 * provisionado travaria justamente o que ela faz sozinha.
 *
 * A troca por bucket acontece aqui dentro e em nenhum outro lugar: `fotoUrl`
 * continua sendo uma URL e as telas não sabem de onde ela vem.
 */

export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const
export type TipoDeImagem = (typeof TIPOS_ACEITOS)[number]

/** 5 MB. O mesmo teto está como CHECK constraint na tabela. */
export const TAMANHO_MAXIMO = 5 * 1024 * 1024

export type ResultadoDoUpload = { ok: true; url: string } | { ok: false; erro: string }

function ehTipoAceito(tipo: string): tipo is TipoDeImagem {
  return (TIPOS_ACEITOS as readonly string[]).includes(tipo)
}

export async function salvarFoto(arquivo: File, usuarioId: string): Promise<ResultadoDoUpload> {
  if (!ehTipoAceito(arquivo.type)) {
    return { ok: false, erro: 'Envie uma imagem JPEG, PNG, WebP ou AVIF.' }
  }
  if (arquivo.size === 0) {
    return { ok: false, erro: 'O arquivo chegou vazio. Tente enviar de novo.' }
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return { ok: false, erro: 'A imagem passa de 5 MB. Reduza antes de enviar.' }
  }

  const dados = Buffer.from(await arquivo.arrayBuffer())

  const salvo = await db.arquivo.create({
    data: {
      nome: arquivo.name.slice(0, 200) || 'foto',
      tipo: arquivo.type,
      tamanho: dados.byteLength,
      dados,
      criadoPor: usuarioId,
    },
    select: { id: true },
  })

  return { ok: true, url: `/api/arquivos/${salvo.id}` }
}

/** URL que esta ferramenta serve, o que pode ser apagado junto com o produto. */
export function ehArquivoInterno(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith('/api/arquivos/'))
}
