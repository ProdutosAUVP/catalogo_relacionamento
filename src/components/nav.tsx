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
    // Barra escura da marca, como na Central: o verde-escuro AUVP no claro e
    // o preto no escuro. Como o fundo é sempre escuro, o texto é claro nos
    // dois temas, e por isso as cores aqui são literais em vez de tokens.
    <header className="bg-brand-dark dark:bg-background border-b border-white/10">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-display text-base font-semibold tracking-tight text-white">
          Presentes
        </Link>

        <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
          {visiveis.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.rotulo}
            </Link>
          ))}
        </div>

        <div className="ml-auto text-sm text-white/60">
          {nome} · {ROTULO_PERFIL[perfil]}
        </div>
      </nav>
    </header>
  )
}
