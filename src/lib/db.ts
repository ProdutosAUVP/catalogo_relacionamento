import { PrismaClient } from '@prisma/client'

/**
 * Instância única do Prisma.
 *
 * Em desenvolvimento o hot reload do Next recria os módulos a cada alteração;
 * sem o cache no globalThis, cada recarga abriria um novo pool de conexões até
 * o Postgres recusar novas.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
