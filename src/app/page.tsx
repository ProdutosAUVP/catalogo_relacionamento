import Link from 'next/link'
import type { Route } from 'next'
import { exigirUsuario } from '@/lib/auth-guards'
import { pode, type Acao } from '@/lib/permissions'
import { saldoDoMes } from '@/lib/saldo'
import { formatarBRL } from '@/lib/money'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CabecalhoDaPagina } from '@/components/pagina'

type Atalho = {
  href: Route
  titulo: string
  texto: string
  acao: Acao
}

export default async function Home() {
  const usuario = await exigirUsuario()
  const mostraSaldo = pode(usuario.perfil, 'saldo.verProprio')
  const saldo = mostraSaldo ? await saldoDoMes(usuario.id) : null

  // `Route` é exigido por `typedRoutes`: o href é validado em compilação.
  // A anotação fica no literal, e não no resultado do filtro, porque a tipagem
  // contextual não atravessa o `.filter()`.
  const todos: Atalho[] = [
    {
      href: '/catalogo',
      titulo: 'Catálogo',
      texto: 'Ver os presentes disponíveis',
      acao: 'catalogo.ver',
    },
    {
      href: '/solicitacoes/nova',
      titulo: 'Nova solicitação',
      texto: 'Escolher cliente, itens e escrever a carta',
      acao: 'solicitacao.criar',
    },
    {
      href: '/financeiro/compras',
      titulo: 'Fila de compras',
      texto: 'Itens enviados para compra',
      acao: 'compras.verFila',
    },
    {
      href: '/admin/solicitacoes',
      titulo: 'Gestão',
      texto: 'Acompanhar e alterar status',
      acao: 'solicitacao.verTodas',
    },
  ]

  const atalhos = todos.filter((a) => pode(usuario.perfil, a.acao))

  return (
    <>
      <CabecalhoDaPagina
        titulo={`Olá, ${usuario.nome.split(' ')[0]}`}
        descricao="O que você quer fazer?"
      />

      {saldo ? (
        <Card className="mb-6">
          <CardHeader>
            <CardDescription>Gasto no mês</CardDescription>
            <CardTitle className="text-2xl">{formatarBRL(saldo.gasto)}</CardTitle>
          </CardHeader>
          {saldo.limite ? (
            <CardContent className="text-muted-foreground text-sm">
              Limite mensal de {formatarBRL(saldo.limite)}
              {saldo.estourou ? ' — limite ultrapassado.' : '.'}
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {atalhos.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="hover:border-foreground/20 h-full transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{a.titulo}</CardTitle>
                <CardDescription>{a.texto}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}
