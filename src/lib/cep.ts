/**
 * Manipulação de CEP: normalização, validação e máscara.
 *
 * Separado de `viacep.ts` de propósito. Estas funções são puras e usadas pelos
 * schemas de validação; deixá-las junto do cliente HTTP faria qualquer
 * validação de formulário arrastar a leitura de variáveis de ambiente.
 */

export function normalizarCep(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function cepValido(valor: string): boolean {
  return normalizarCep(valor).length === 8
}

export function formatarCep(valor: string): string {
  const d = normalizarCep(valor)
  if (d.length !== 8) return valor
  return `${d.slice(0, 5)}-${d.slice(5)}`
}
