import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { formatarBRL, totalDosItens } from '@/lib/money'
import { formatarData } from '@/lib/datas'
import { filtroSolicitacoesSchema, whereDeSolicitacoes } from '@/lib/validators/filtros'
import { ROTULO_STATUS, STATUS_FORA_DO_SALDO } from '@/lib/status'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
import { BarraDeFiltros, CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'

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

  const [solicitacoes, total, consultores, comProblema, soma] = await Promise.all([
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
    db.solicitacao.count({ where: { ...where, status: 'deu_problema' } }),
    db.solicitacao.aggregate({
      where: { ...where, status: { notIn: [...STATUS_FORA_DO_SALDO] } },
      _sum: { valorTotal: true },
    }),
  ])

  // A exportação recebe exatamente os mesmos parâmetros da tela.
  const queryAtual = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      v === undefined ? [] : [v].flat().map((valor) => [k, String(valor)] as [string, string]),
    ),
  ).toString()

  const filtrando = Boolean(
    params.busca || params.de || params.ate || params.consultorId || params.status,
  )

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Gestão"
        titulo="Solicitações"
        descricao="Acompanhe o fluxo inteiro, corrija dados e exporte o resultado filtrado."
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

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat rotulo="Solicitações no filtro" valor={total} />
        <Stat
          rotulo="Valor somado"
          valor={formatarBRL(soma._sum.valorTotal ?? totalDosItens([]))}
          apoio="Canceladas e devolvidas fora da conta."
        />
        <Stat
          rotulo="Precisando de atenção"
          valor={comProblema}
          apoio={comProblema === 0 ? 'Nenhuma com problema.' : 'Com status “deu problema”.'}
        />
      </div>

      <BarraDeFiltros>
        <form method="get" className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            name="busca"
            defaultValue={filtro.busca}
            placeholder="Código, cliente ou consultor"
            aria-label="Buscar solicitações"
            className="w-56"
          />
          <Input
            name="de"
            type="date"
            defaultValue={params.de as string}
            aria-label="Data inicial"
            className="w-40"
          />
          <Input
            name="ate"
            type="date"
            defaultValue={params.ate as string}
            aria-label="Data final"
            className="w-40"
          />
          <Select
            name="consultorId"
            defaultValue={filtro.consultorId ?? ''}
            aria-label="Filtrar por consultor"
            className="w-auto min-w-48"
          >
            <option value="">Todos os consultores</option>
            {consultores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Select
            name="status"
            defaultValue={(params.status as string) ?? ''}
            aria-label="Filtrar por status"
            className="w-auto min-w-48"
          >
            <option value="">Todos os status</option>
            {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
          {filtrando ? (
            <Button variant="ghost" asChild>
              <Link href="/admin/solicitacoes">Limpar</Link>
            </Button>
          ) : null}
        </form>
      </BarraDeFiltros>

      {solicitacoes.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma solicitação encontrada"
          descricao={
            filtrando
              ? 'Nenhuma solicitação bate com os filtros aplicados. Ajuste o período ou limpe os filtros.'
              : 'Assim que os consultores começarem a solicitar presentes, eles aparecem aqui.'
          }
          acao={
            filtrando ? (
              <Button variant="outline" asChild>
                <Link href="/admin/solicitacoes">Limpar filtros</Link>
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
                <TableHead>Consultor</TableHead>
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
                    <Link
                      href={`/admin/solicitacoes/${s.id}`}
                      className="hover:text-primary-emphasis underline-offset-4 hover:underline"
                    >
                      {s.codigo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
                    {formatarData(s.dataSolicitacao)}
                  </TableCell>
                  <TableCell>{s.consultor.nome}</TableCell>
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
