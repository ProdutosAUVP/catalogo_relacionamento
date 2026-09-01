import { env } from './env'
import { cepValido, normalizarCep } from './cep'

/**
 * Autopreenchimento de endereço por CEP.
 *
 * O ViaCEP responde 200 com `{ erro: true }` para CEP inexistente, então o
 * status HTTP sozinho não basta para decidir se achou.
 */

export type EnderecoViaCep = {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export type ResultadoCep = { ok: true; endereco: EnderecoViaCep } | { ok: false; erro: string }

export async function buscarCep(cep: string): Promise<ResultadoCep> {
  const limpo = normalizarCep(cep)

  if (!cepValido(limpo)) {
    return { ok: false, erro: 'CEP deve ter 8 dígitos.' }
  }

  try {
    const resposta = await fetch(`${env.VIACEP_BASE_URL}/${limpo}/json/`, {
      // O CEP muda raramente; cachear evita repetir a chamada a cada digitação.
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!resposta.ok) {
      return { ok: false, erro: 'Não foi possível consultar o CEP agora.' }
    }

    const dados = (await resposta.json()) as Record<string, unknown>

    if (dados.erro) {
      return { ok: false, erro: 'CEP não encontrado.' }
    }

    return {
      ok: true,
      endereco: {
        cep: limpo,
        logradouro: String(dados.logradouro ?? ''),
        bairro: String(dados.bairro ?? ''),
        cidade: String(dados.localidade ?? ''),
        uf: String(dados.uf ?? ''),
      },
    }
  } catch {
    // Falha de rede não pode travar a solicitação: a tela cai para
    // preenchimento manual do endereço.
    return { ok: false, erro: 'Falha de conexão ao consultar o CEP.' }
  }
}

export { normalizarCep, cepValido, formatarCep } from './cep'
