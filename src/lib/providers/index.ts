import { env } from '@/lib/env'
import { catalogoLocal } from './catalogo/local'
import { catalogoTiny } from './catalogo/tiny'
import { clientesLocal } from './clientes/local'
import { clientesSalesforce } from './clientes/salesforce'
import type { CatalogoProvider, ClienteProvider } from './types'

/**
 * Ponto único de resolução dos providers.
 *
 * As telas importam `catalogoProvider` e `clienteProvider` daqui. Ligar o Tiny
 * ou o Salesforce na fase 2 é mudar `CATALOG_PROVIDER` / `CLIENT_PROVIDER` no
 * ambiente: nenhuma tela precisa saber.
 */

export const catalogoProvider: CatalogoProvider =
  env.CATALOG_PROVIDER === 'tiny' ? catalogoTiny : catalogoLocal

export const clienteProvider: ClienteProvider =
  env.CLIENT_PROVIDER === 'salesforce' ? clientesSalesforce : clientesLocal

export * from './types'
