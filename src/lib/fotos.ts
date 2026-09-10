/**
 * Convenção de foto de verso, a mesma da Central: um produto com os dois lados
 * desenhados não precisa de campo novo no banco — basta existir o arquivo
 * `<slug>-verso.webp` ao lado da foto da frente, e o card vira no hover.
 *
 * A lista existe porque o servidor não vai ao disco a cada card só para
 * descobrir se o arquivo está lá.
 *
 * Está vazia: o catálogo que a área mandou tem uma foto por produto. A
 * convenção fica de pé para quando alguma peça voltar a ter os dois lados —
 * basta pôr o arquivo em `imgs produtos/` com o sufixo e o slug aqui.
 */
const COM_VERSO = new Set<string>()

export function versoDaFoto(fotoUrl: string | null | undefined): string | null {
  if (!fotoUrl) return null

  const slug = fotoUrl
    .split('/')
    .pop()
    ?.replace(/\.\w+$/, '')
  if (!slug || !COM_VERSO.has(slug)) return null

  return fotoUrl.replace(/(\.\w+)$/, '-verso$1')
}
