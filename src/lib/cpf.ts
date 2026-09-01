/**
 * CPF é a chave de deduplicação de cliente, então ele é sempre gravado
 * normalizado (só dígitos). A máscara é assunto de exibição.
 */

export function normalizarCpf(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function formatarCpf(valor: string): string {
  const d = normalizarCpf(valor)
  if (d.length !== 11) return valor
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Mascara para exibição a quem não tem permissão de ver o dado completo. */
export function mascararCpf(valor: string): string {
  const d = normalizarCpf(valor)
  if (d.length !== 11) return '***'
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}

/** Validação pelos dois dígitos verificadores. */
export function cpfValido(valor: string): boolean {
  const d = normalizarCpf(valor)
  if (d.length !== 11) return false
  // Sequências repetidas passam no cálculo do dígito, mas não são CPFs válidos.
  if (/^(\d)\1{10}$/.test(d)) return false

  const digito = (ate: number): number => {
    let soma = 0
    let peso = ate + 1
    for (let i = 0; i < ate; i++) {
      soma += Number(d[i]) * peso
      peso--
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10])
}
