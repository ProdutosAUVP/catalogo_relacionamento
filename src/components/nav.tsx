import Link from 'next/link'
import type { Route } from 'next'
import type { Perfil } from '@prisma/client'
import { pode, ROTULO_PERFIL, type Acao } from '@/lib/permissions'

/**
 * Navegação montada a partir da matriz de permissões.
 *
 * O menu não é controle de acesso — cada rota tem a própria guarda de servidor.
 * Ele existe para não oferecer à pessoa um caminho que terminaria em redirect.
 */

type ItemDeMenu = { href: Route; rotulo: string; acao: Acao }

const ITENS: readonly ItemDeMenu[] = [
  { href: '/catalogo', rotulo: 'Catálogo', acao: 'catalogo.ver' },
  { href: '/solicitacoes', rotulo: 'Minhas solicitações', acao: 'solicitacao.verProprias' },
  { href: '/financeiro/compras', rotulo: 'Fila de compras', acao: 'compras.verFila' },
  { href: '/admin/solicitacoes', rotulo: 'Gestão', acao: 'solicitacao.verTodas' },
  { href: '/admin/catalogo', rotulo: 'Gerenciar catálogo', acao: 'catalogo.gerenciar' },
  { href: '/admin/clientes', rotulo: 'Clientes', acao: 'cliente.gerenciar' },
  { href: '/admin/usuarios', rotulo: 'Usuários', acao: 'usuario.gerenciar' },
] as const

export function Nav({ perfil, nome }: { perfil: Perfil; nome: string }) {
  const visiveis = ITENS.filter((item) => pode(perfil, item.acao))

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-sm font-semibold">
          Presentes
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {visiveis.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {item.rotulo}
            </Link>
          ))}
        </div>

        <div className="text-muted-foreground ml-auto text-sm">
          {nome} · {ROTULO_PERFIL[perfil]}
        </div>
      </nav>
    </header>
  )
}
