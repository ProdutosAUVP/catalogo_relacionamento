import { Prisma } from '@prisma/client'

/**
 * Dinheiro nunca vira `number` no caminho entre banco e tela.
 *
 * Os valores são `Decimal(12,2)` no Postgres e `Prisma.Decimal` na aplicação.
 * Um `valor * quantidade` em ponto flutuante fecha a soma errada no CSV, que é
 * exatamente o que o critério de aceite da exportação verifica.
 */

export type Dinheiro = Prisma.Decimal

export const ZERO = new Prisma.Decimal(0)

export function dinheiro(valor: Prisma.Decimal.Value): Dinheiro {
  return new Prisma.Decimal(valor)
}

export function somar(valores: Prisma.Decimal.Value[]): Dinheiro {
  return valores.reduce<Dinheiro>((acc, v) => acc.plus(v), ZERO)
}

/** Subtotal de um item: valor unitário × quantidade. */
export function subtotal(valorUnitario: Prisma.Decimal.Value, quantidade: number): Dinheiro {
  return new Prisma.Decimal(valorUnitario).times(quantidade)
}

/** Total de uma solicitação a partir dos seus itens. */
export function totalDosItens(
  itens: readonly { valorUnitario: Prisma.Decimal.Value; quantidade: number }[],
): Dinheiro {
  return itens.reduce<Dinheiro>((acc, i) => acc.plus(subtotal(i.valorUnitario, i.quantidade)), ZERO)
}

const FORMATADOR = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatarBRL(valor: Prisma.Decimal.Value): string {
  return FORMATADOR.format(new Prisma.Decimal(valor).toNumber())
}

/** Valor para célula numérica de planilha, onde a soma é feita pelo Excel. */
export function paraNumero(valor: Prisma.Decimal.Value): number {
  return new Prisma.Decimal(valor).toNumber()
}
