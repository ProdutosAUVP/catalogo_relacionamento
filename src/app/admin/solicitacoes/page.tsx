import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { formatarBRL } from '@/lib/money'
import { formatarData } from '@/lib/datas'
import { filtroSolicitacoesSchema, whereDeSolicitacoes } from '@/lib/validators/filtros'
import { ROTULO_STATUS } from '@/lib/status'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
 * Painel de gestão.
 *
 * Os filtros da tela e os da exportação leem o mesmo schema e produzem o mesmo
 * `where`. É isso que sustenta o critério "a exportação respeita os filtros".
 */
export default async function AdminSolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const usuario = await exigirPermissao('solicitacao.verTodas')

  const params = await searchParams
  const filtro = filtroSolicitacoesSchema.parse({
    ...params,
    status: params.status ? [params.status].flat() : undefined,
  })

  const where = whereDeSolicitacoes(filtro)

  const [solicitacoes, total, consultores] = await Promise.all([
    db.solicitacao.findMany({
      where,
      include: {
        cliente: { select: { nome: true } },
        consultor: { select: { nome: true } },
        _count: { select: { itens: true } },
      },
      orderBy: { dataSolicitacao: 'desc' },
      skip: (filtro.pagina - 1) * filtro.porPagina,
      take: filtro.porPagina,
    }),
    db.solicitacao.count({ where }),
    db.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  // A exportação recebe exatamente os mesmos parâmetros da tela.
  const queryAtual = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      v === undefined ? [] : [v].flat().map((valor) => [k, String(valor)] as [string, string]),
    ),
  ).toString()

  return (
    <>
      <CabecalhoDaPagina
        titulo="Solicitações"
        descricao={`${total} ${total === 1 ? 'solicitação' : 'solicitações'} no filtro atual`}
        acoes={
          pode(usuario.perfil, 'exportar') ? (
            <>
              <Button variant="outline" asChild>
                <a href={`/api/export/csv?${queryAtual}`}>Exportar CSV</a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/export/xlsx?${queryAtual}`}>Exportar XLSX</a>
              </Button>
            </>
          ) : null
        }
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <Input
          name="busca"
          defaultValue={filtro.busca}
          placeholder="Código, cliente ou consultor"
          className="max-w-56"
        />
        <Input name="de" type="date" defaultValue={params.de as string} className="max-w-40" />
        <Input name="ate" type="date" defaultValue={params.ate as string} className="max-w-40" />
        <select
          name="consultorId"
          defaultValue={filtro.consultorId ?? ''}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">Todos os consultores</option>
          {consultores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={(params.status as string) ?? ''}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/admin/solicitacoes">Limpar</Link>
        </Button>
      </form>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Consultor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Itens</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                  Nenhuma solicitação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              solicitacoes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/solicitacoes/${s.id}`}
                      className="underline underline-offset-2"
                    >
                      {s.codigo}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatarData(s.dataSolicitacao)}
                  </TableCell>
                  <TableCell>{s.consultor.nome}</TableCell>
                  <TableCell>{s.cliente.nome}</TableCell>
                  <TableCell className="text-right">{s._count.itens}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatarBRL(s.valorTotal)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
