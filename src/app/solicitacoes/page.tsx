import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth-guards'
import { filtroDeSolicitacoes, pode } from '@/lib/permissions'
import { saldoDoMes } from '@/lib/saldo'
import { formatarBRL } from '@/lib/money'
import { formatarData } from '@/lib/datas'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { Stat } from '@/components/stat'
import { CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'

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

  const mes = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  const podeCriar = pode(usuario.perfil, 'solicitacao.criar')

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Minhas solicitações"
        titulo="Solicitações"
        descricao="Os presentes que você pediu, com o status de cada envio."
        acoes={
          podeCriar ? (
            <Button asChild>
              <Link href="/solicitacoes/nova">Nova solicitação</Link>
            </Button>
          ) : null
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          destaque
          rotulo={`Gasto em ${mes}`}
          valor={formatarBRL(saldo.gasto)}
          className="sm:col-span-2 lg:col-span-1"
          apoio={
            saldo.limite ? (
              <div className="space-y-2">
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={saldo.estourou ? 'bg-error h-full' : 'bg-success h-full'}
                    style={{ width: `${Math.min(100, saldo.percentual ?? 0)}%` }}
                  />
                </div>
                <p>
                  de {formatarBRL(saldo.limite)}
                  {saldo.estourou ? ' — limite do mês ultrapassado.' : ' no limite do mês.'}
                </p>
              </div>
            ) : (
              'Sem limite mensal definido. Canceladas e devolvidas não entram na conta.'
            )
          }
        />
        <Stat rotulo="Solicitações" valor={solicitacoes.length} apoio="Total já criado por você." />
        <Stat
          rotulo="Entregues"
          valor={
            solicitacoes.filter((s) => s.status === 'entregue' || s.status === 'cliente_confirmou')
              .length
          }
          apoio="Chegaram ao cliente."
        />
      </div>

      {solicitacoes.length === 0 ? (
        <EstadoVazio
          titulo="Você ainda não fez nenhuma solicitação"
          descricao="Escolha um presente no catálogo, informe o cliente e escreva a carta que acompanha o envio."
          acao={
            podeCriar ? (
              <Button asChild>
                <Link href="/solicitacoes/nova">Criar a primeira</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium whitespace-nowrap tabular-nums">
                    {s.codigo}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
                    {formatarData(s.dataSolicitacao)}
                  </TableCell>
                  <TableCell>{s.cliente.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{s._count.itens}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                    {formatarBRL(s.valorTotal)}
                  </TableCell>
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
