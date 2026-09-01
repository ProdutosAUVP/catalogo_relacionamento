import { ProviderIndisponivelError, type CatalogoProvider } from '../types'

/**
 * Fase 2 — catálogo vindo do Tiny ERP.
 *
 * Deliberadamente não implementado. O arquivo existe para fixar o contrato e
 * deixar visível o que falta: consulta de produtos e de estoque pela API do
 * Tiny, casada com `sku_tiny`, e a decisão sobre itens externos, que não têm
 * SKU e continuarão vindo do catálogo local.
 *
 * Ver docs/06-integracoes-fase-2.md.
 */

function naoImplementado(): never {
  throw new ProviderIndisponivelError(
    'tiny',
    new Error('Integração com o Tiny ERP é escopo da fase 2 e ainda não foi implementada.'),
  )
}

export const catalogoTiny: CatalogoProvider = {
  nome: 'tiny',
  listar: naoImplementado,
  obter: naoImplementado,
  consultarEstoque: naoImplementado,
}
