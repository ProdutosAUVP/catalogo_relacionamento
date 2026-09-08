/**
 * Convenção de foto de verso, a mesma da Central: um produto com os dois lados
 * desenhados não precisa de campo novo no banco — basta existir o arquivo
 * `<slug>-verso.webp` ao lado da foto da frente.
 *
 * A lista abaixo existe porque o servidor não vai ao disco a cada card só para
 * descobrir se o arquivo está lá. Quando o upload para o bucket for construído,
 * ela dá lugar a uma coluna `foto_verso_url`.
 */
const COM_VERSO = new Set(['caneca-aupo11'])

export function versoDaFoto(fotoUrl: string | null | undefined): string | null {
  if (!fotoUrl) return null

  const slug = fotoUrl
    .split('/')
    .pop()
    ?.replace(/\.\w+$/, '')
  if (!slug || !COM_VERSO.has(slug)) return null

  return fotoUrl.replace(/(\.\w+)$/, '-verso$1')
}
