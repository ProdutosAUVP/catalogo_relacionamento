/**
 * Onde cada categoria é comprada, quando não há link em lugar nenhum.
 *
 * É o último recurso da fila de compras. O catálogo da área traz o link produto
 * a produto (`Produto.urlCompra`), e o presente específico traz o que o
 * consultor digitou — os dois vencem este mapa, porque apontam para o item, e
 * não para a loja.
 *
 * O que sobra aqui é o caso do produto cadastrado sem link: bebida é sempre
 * comprada na Casa da Bebida, então o Financeiro chega à loja certa mesmo
 * assim. Outras categorias entram à medida que forem definidas.
 *
 * Mapa fixo, e não coluna no banco, porque é regra da área e não dado que
 * alguém edita tela a tela — para isso já existe `urlCompra` no produto.
 */
const POR_CATEGORIA: Record<string, string> = {
  // A área passou `casadabebida.com.br/u`; o `/u` parece truncado, então fica
  // o domínio, que resolve para a loja.
  bebida: 'https://casadabebida.com.br',
  // A planilha antiga usava o plural. Os dois apontam para a mesma loja.
  bebidas: 'https://casadabebida.com.br',
}

export function fornecedorDaCategoria(categoria: string | null | undefined): string | null {
  return POR_CATEGORIA[(categoria ?? '').trim().toLowerCase()] ?? null
}

/**
 * Site que o Financeiro usa para comprar um item.
 *
 * O link do presente específico vence o padrão da categoria: ele foi escolhido
 * pelo consultor para aquele item.
 */
export function siteDeCompra(
  urlExterna: string | null | undefined,
  categoria: string | null | undefined,
): { url: string; origem: 'item' | 'categoria' } | null {
  if (urlExterna) return { url: urlExterna, origem: 'item' }

  const padrao = fornecedorDaCategoria(categoria)
  return padrao ? { url: padrao, origem: 'categoria' } : null
}
