/**
 * Onde cada categoria é comprada, quando o produto não traz um link próprio.
 *
 * O Financeiro precisa do site na fila de compras. Presente específico já
 * carrega o link que o consultor digitou; produto de catálogo não tem campo de
 * link, e até agora aparecia sem origem nenhuma.
 *
 * A área informou o primeiro caso concreto: bebida é sempre comprada na Casa da
 * Bebida. Outras categorias entram aqui à medida que forem definidas.
 *
 * Isto é um mapa fixo, e não uma coluna no banco, porque hoje é uma regra da
 * área e não um dado que alguém edita. Quando o cadastro de produto ganhar o
 * campo de fornecedor, este arquivo vira o valor padrão dele.
 */
const POR_CATEGORIA: Record<string, string> = {
  // A área passou `casadabebida.com.br/u`; o `/u` parece truncado, então fica
  // o domínio, que resolve para a loja.
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
