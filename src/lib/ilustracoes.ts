/**
 * Ilustrações de categoria para os cards do catálogo.
 *
 * O V1 não tem upload de foto, e um catálogo cheio de retângulos cinza escrito
 * "sem foto" parece um sistema quebrado, não um sistema em construção. Cada
 * categoria ganha um traço próprio, desenhado no mesmo peso de linha, de modo
 * que a grade tenha ritmo mesmo antes de existir uma foto real.
 *
 * Quando o produto tiver `fotoUrl`, a foto substitui a ilustração — ela é o
 * estado de repouso do card, não um placeholder de erro.
 *
 * Traçado sem preenchimento, `currentColor`, viewBox 200×150.
 */

export type Ilustracao = {
  /** Conteúdo do <svg>, já com stroke definido por classe no componente. */
  path: string
  /** Usado quando a categoria não casa com nenhuma conhecida. */
  padrao?: boolean
}

const PRESENTE_GENERICO = `
  <rect x="62" y="66" width="76" height="50" rx="4" />
  <path d="M58 54h84v12H58z" />
  <path d="M100 54v62" />
  <path d="M100 54c-6-10-22-14-26-6-3 6 6 10 26 6zM100 54c6-10 22-14 26-6 3 6-6 10-26 6z" />
`

export const ILUSTRACOES: Record<string, Ilustracao> = {
  'vinhos e destilados': {
    path: `
      <path d="M74 34h16v20c0 8 9 12 9 24v34a10 10 0 0 1-10 10H75a10 10 0 0 1-10-10V78c0-12 9-16 9-24z" />
      <path d="M65 74h34" />
      <path d="M118 40h30v14c0 12-6 21-15 21s-15-9-15-21z" />
      <path d="M133 75v27" />
      <path d="M119 102h28" />
    `,
  },
  'casa e decoração': {
    path: `
      <path d="M82 74c0-11 7-13 7-20h22c0 7 7 9 7 20v22a14 14 0 0 1-14 14h-8a14 14 0 0 1-14-14z" />
      <path d="M89 54h22" />
      <path d="M100 54V26" />
      <path d="M100 40c-8 0-14-5-14-12 8 0 14 5 14 12zM100 34c8 0 14-5 14-12-8 0-14 5-14 12z" />
    `,
  },
  livros: {
    path: `
      <path d="M100 48c-14-8-30-10-44-7v62c14-3 30-1 44 7z" />
      <path d="M100 48c14-8 30-10 44-7v62c-14-3-30-1-44 7z" />
      <path d="M100 48v62" />
      <path d="M68 60h20M68 74h20M112 60h20M112 74h20" />
    `,
  },
  gourmet: {
    path: `
      <path d="M62 72h76l-8 42a8 8 0 0 1-8 6H78a8 8 0 0 1-8-6z" />
      <path d="M58 62h84v10H58z" />
      <path d="M74 72l4 48M100 72v48M126 72l-4 48" />
      <path d="M72 86h56M70 100h60" />
      <path d="M76 62c0-16 11-24 24-24s24 8 24 24" />
    `,
  },
  'bem-estar': {
    path: `
      <path d="M72 72h50v18a25 25 0 0 1-50 0z" />
      <path d="M122 78h4a11 11 0 0 1 0 22h-6" />
      <path d="M64 116h66" />
      <path d="M88 60c-7-6 7-12 0-18s7-12 0-18M106 60c-7-6 7-12 0-18s7-12 0-18" />
    `,
  },

  // --- Por produto -----------------------------------------------------------
  // Categoria sozinha repete: dois itens de "Gourmet" ganhariam a mesma cesta.
  // Estas entradas são escolhidas por palavra no nome do produto e têm
  // precedência sobre a categoria.
  chocolate: {
    path: `
      <path d="M62 80h76v30a8 8 0 0 1-8 8H70a8 8 0 0 1-8-8z" />
      <path d="M62 80l14-22h48l14 22" />
      <circle cx="82" cy="96" r="7" />
      <circle cx="100" cy="96" r="7" />
      <circle cx="118" cy="96" r="7" />
    `,
  },
  taca: {
    path: `
      <path d="M62 44h30v14c0 12-6 21-15 21s-15-9-15-21z" />
      <path d="M77 79v25M64 104h26" />
      <path d="M108 44h30v14c0 12-6 21-15 21s-15-9-15-21z" />
      <path d="M123 79v25M110 104h26" />
    `,
  },
  espumante: {
    path: `
      <path d="M74 40h20v40c0 10-4 16-10 16s-10-6-10-16z" />
      <path d="M84 96v20M74 116h20" />
      <path d="M106 40h20v40c0 10-4 16-10 16s-10-6-10-16z" />
      <path d="M116 96v20M106 116h20" />
      <circle cx="82" cy="58" r="2.5" />
      <circle cx="88" cy="70" r="2" />
      <circle cx="114" cy="64" r="2.5" />
      <circle cx="120" cy="52" r="2" />
    `,
  },
  difusor: {
    path: `
      <path d="M84 90h32v22a10 10 0 0 1-10 10h-12a10 10 0 0 1-10-10z" />
      <path d="M92 78h16v12H92z" />
      <path d="M100 78V38M100 78l-16-32M100 78l16-32" />
    `,
  },
  caneca: {
    path: `
      <path d="M72 68h44v40a10 10 0 0 1-10 10H82a10 10 0 0 1-10-10z" />
      <path d="M116 78h6a12 12 0 0 1 0 24h-6" />
      <path d="M72 82h44" />
    `,
  },

  'placas e troféus': {
    path: `
      <rect x="66" y="34" width="68" height="62" rx="6" />
      <path d="M100 50l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" />
      <path d="M84 110h32v10H84z" />
      <path d="M100 96v14" />
    `,
  },
  // --- Categorias do catálogo real de brindes AUVP ---
  // Só entram em cena quando o produto não tem foto cadastrada.
  'canecas e garrafas': {
    path: `
      <path d="M72 68h44v40a10 10 0 0 1-10 10H82a10 10 0 0 1-10-10z" />
      <path d="M116 78h6a12 12 0 0 1 0 24h-6" />
      <path d="M72 82h44" />
    `,
  },
  bebidas: {
    path: `
      <path d="M84 34h32v20c0 8 9 12 9 24v34a10 10 0 0 1-10 10H85a10 10 0 0 1-10-10V78c0-12 9-16 9-24z" />
      <path d="M75 74h50" />
      <path d="M84 88h32v22H84z" />
    `,
  },
  papelaria: {
    path: `
      <rect x="70" y="34" width="60" height="82" rx="6" />
      <path d="M84 52h32M84 68h32M84 84h20" />
      <path d="M112 28v16" />
    `,
  },
  'sacolas & caixas': {
    path: `
      <path d="M70 62h60l6 54a8 8 0 0 1-8 8H72a8 8 0 0 1-8-8z" />
      <path d="M84 62V48a16 16 0 0 1 32 0v14" />
    `,
  },
  'casa & mesa': {
    path: `
      <path d="M80 74h40v34a10 10 0 0 1-10 10H90a10 10 0 0 1-10-10z" />
      <path d="M80 74h40" />
      <path d="M100 74V56" />
      <path d="M100 56c-6-5-6-11 0-16 6 5 6 11 0 16z" />
    `,
  },
  vestuário: {
    path: `
      <path d="M78 46l-14 10 10 16 8-6v50a6 6 0 0 0 6 6h28a6 6 0 0 0 6-6V66l8 6 10-16-14-10-14-6H92z" />
      <path d="M92 40a8 8 0 0 0 16 0" />
    `,
  },
  acessórios: {
    path: `
      <rect x="64" y="66" width="72" height="46" rx="8" />
      <path d="M64 84h72" />
      <path d="M112 92h12" />
    `,
  },

  padrao: { path: PRESENTE_GENERICO, padrao: true },
}

/**
 * Palavras no nome do produto que escolhem uma ilustração específica.
 *
 * A ordem importa: a primeira que casar vence. "espumante" vem antes de
 * "vinho" porque a taça alta distingue os dois na mesma prateleira.
 */
const POR_PALAVRA: readonly (readonly [RegExp, string])[] = [
  [/chocolate|bombom/, 'chocolate'],
  [/espumante|champanhe/, 'espumante'],
  [/ta[çc]a/, 'taca'],
  [/difusor/, 'difusor'],
  [/caneca|x[íi]cara/, 'caneca'],
  [/cesta/, 'gourmet'],
  [/ch[áa]\b/, 'bem-estar'],
  [/livro/, 'livros'],
  [/placa|trof[ée]u/, 'placas e troféus'],
  [/vinho|whisky|gin\b/, 'vinhos e destilados'],
] as const

function normalizar(texto: string | null | undefined): string {
  return (texto ?? '').trim().toLowerCase().normalize('NFC')
}

/** Ilustração da categoria, quando o produto não pede uma específica. */
export function ilustracaoDaCategoria(categoria: string | null | undefined): string {
  return (ILUSTRACOES[normalizar(categoria)] ?? ILUSTRACOES.padrao!).path
}

/**
 * Ilustração de um produto: primeiro pelo nome, depois pela categoria.
 *
 * Sem a busca por nome, dois produtos da mesma categoria dividem o mesmo
 * desenho, e a grade do catálogo passa a parecer preenchida por acaso.
 */
export function ilustracaoDoProduto(
  nome: string | null | undefined,
  categoria: string | null | undefined,
): string {
  const alvo = normalizar(nome)

  for (const [padrao, chave] of POR_PALAVRA) {
    if (padrao.test(alvo)) {
      const encontrada = ILUSTRACOES[chave]
      if (encontrada) return encontrada.path
    }
  }

  return ilustracaoDaCategoria(categoria)
}
