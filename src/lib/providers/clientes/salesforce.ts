import { ProviderIndisponivelError, type ClienteProvider } from '../types'

/**
 * Fase 2: clientes vindos do Salesforce.
 *
 * Não implementado por decisão de escopo. Duas perguntas precisam de resposta
 * antes: quais campos podem ser consultados e por qual chave (CPF ou ID).
 *
 * Quando entrar, `salesforce_id` já existe em `clientes` desde o V1, então o
 * casamento dos registros não exige migração.
 * Ver docs/04-integracoes-fase-2.md.
 */

function naoImplementado(): never {
  throw new ProviderIndisponivelError(
    'salesforce',
    new Error('Integração com o Salesforce é escopo da fase 2 e ainda não foi implementada.'),
  )
}

export const clientesSalesforce: ClienteProvider = {
  nome: 'salesforce',
  buscarPorCpf: naoImplementado,
  buscarPorTexto: naoImplementado,
  obter: naoImplementado,
}
