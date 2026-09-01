import type { Prisma } from '@prisma/client'
import { anoCorrente } from './datas'

/**
 * Geração do código legível da solicitação: SOL-2026-0001.
 *
 * O contador vive em tabela própria e é incrementado com um UPDATE atômico
 * dentro da mesma transação que cria a solicitação. Contar linhas existentes
 * (`count + 1`) abriria corrida entre dois consultores salvando ao mesmo
 * tempo e geraria códigos duplicados.
 */

export function formatarCodigo(ano: number, sequencial: number): string {
  return `SOL-${ano}-${String(sequencial).padStart(4, '0')}`
}

/**
 * Reserva o próximo código do ano. Precisa receber o client transacional para
 * que o número só exista se a solicitação existir.
 */
export async function proximoCodigo(
  tx: Prisma.TransactionClient,
  referencia: Date = new Date(),
): Promise<string> {
  const ano = anoCorrente(referencia)

  const contador = await tx.contadorCodigo.upsert({
    where: { ano },
    create: { ano, valor: 1 },
    update: { valor: { increment: 1 } },
  })

  return formatarCodigo(ano, contador.valor)
}
