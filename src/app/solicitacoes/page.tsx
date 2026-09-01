import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth-guards'
import { filtroDeSolicitacoes, pode } from '@/lib/permissions'
import { saldoDoMes } from '@/lib/saldo'
import { formatarBRL } from '@/lib/money'
import { formatarData } from '@/lib/datas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { CabecalhoDaPagina } from '@/components/pagina'

/**
 * Lista das solicitações do consultor, com o saldo do mês em destaque.
 *
 * O `where` vem de `filtroDeSolicitacoes`, e não de um filtro escrito à mão,
 * para que o critério "o consultor só enxerga as próprias" não dependa de quem
 * escreveu a query.
 */
export default async function SolicitacoesPage() {
  const usuario = await exigirUsuario()

  const filtro = filtroDeSolicitacoes(usuario.perfil, usuario.id)
  if (!filtro) return null

  const [solicitacoes, saldo] = await Promise.all([
    db.solicitacao.findMany({
      where: filtro,
      include: { cliente: { select: { nome: true } }, _count: { select: { itens: true } } },
      orderBy: { dataSolicitacao: 'desc' },
      take: 100,
    }),
    saldoDoMes(usuario.id),
  ])

  return (
    <>
      <CabecalhoDaPagina
        titulo="Minhas solicitações"
        acoes={
          pode(usuario.perfil, 'solicitacao.criar') ? (
            <Button asChild>
              <Link href="/solicitacoes/nova">Nova solicitação</Link>
            </Button>
          ) : null
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardDescription>Gasto no mês</CardDescription>
          <CardTitle className="text-2xl">{formatarBRL(saldo.gasto)}</CardTitle>
        </CardHeader>
        {saldo.limite ? (
          <CardContent className="space-y-2">
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className={saldo.estourou ? 'h-full bg-red-500' : 'h-full bg-emerald-500'}
                style={{ width: `${Math.min(100, saldo.percentual ?? 0)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-sm">
              {formatarBRL(saldo.gasto)} de {formatarBRL(saldo.limite)}
              {/* V1 apenas sinaliza. O bloqueio depende de decisão da área. */}
              {saldo.estourou ? ' — limite do mês ultrapassado.' : ''}
            </p>
          </CardContent>
        ) : null}
      </Card>

      {solicitacoes.length === 0 ? (
        <p className="text-muted-foreground text-sm">Você ainda não fez nenhuma solicitação.</p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.codigo}</TableCell>
                  <TableCell>{formatarData(s.dataSolicitacao)}</TableCell>
                  <TableCell>{s.cliente.nome}</TableCell>
                  <TableCell>{s._count.itens}</TableCell>
                  <TableCell>{formatarBRL(s.valorTotal)}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
