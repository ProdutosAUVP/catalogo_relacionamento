import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { formatarBRL, subtotal } from '@/lib/money'
import { formatarData } from '@/lib/datas'
import { formatarCpf, formatarTelefone } from '@/lib/cpf'
import { formatarCep } from '@/lib/cep'
import { ROTULO_STATUS, transicoesPermitidas, exigeMotivo } from '@/lib/status'
import { ROTULO_MOTIVO } from '@/lib/validators/solicitacao'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { LinhaDoTempo } from '@/components/linha-do-tempo'
import { CabecalhoDaPagina, AConstruir } from '@/components/pagina'

/** Detalhe da solicitação: itens, entrega, carta e histórico completo. */
export default async function DetalheSolicitacaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const usuario = await exigirPermissao('solicitacao.verTodas')
  const { id } = await params

  const solicitacao = await db.solicitacao.findUnique({
    where: { id },
    include: {
      cliente: true,
      consultor: { select: { nome: true, email: true } },
      itens: { include: { produto: { select: { nome: true } } } },
      historico: {
        include: { usuario: { select: { nome: true } } },
        orderBy: { criadoEm: 'desc' },
      },
    },
  })

  if (!solicitacao) notFound()

  const proximos = transicoesPermitidas(solicitacao.status)
  const podeAlterar = pode(usuario.perfil, 'solicitacao.alterarStatus')

  return (
    <>
      <Link
        href="/admin/solicitacoes"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <span aria-hidden="true">←</span> Voltar para a gestão
      </Link>

      <CabecalhoDaPagina
        sobrancelha={`${formatarData(solicitacao.dataSolicitacao)} · ${solicitacao.consultor.nome}`}
        titulo={solicitacao.codigo}
        acoes={<StatusBadge status={solicitacao.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Itens</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Unitário</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacao.itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-medium">
                        {item.produto?.nome ?? item.descricaoLivre}
                      </span>
                      {item.urlExterna ? (
                        <a
                          href={item.urlExterna}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary-emphasis mt-0.5 block truncate text-xs underline-offset-4 hover:underline"
                        >
                          {item.urlExterna.replace(/^https?:\/\//, '')}
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantidade}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatarBRL(item.valorUnitario)}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                      {formatarBRL(subtotal(item.valorUnitario, item.quantidade))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-base font-semibold whitespace-nowrap tabular-nums">
                    {formatarBRL(solicitacao.valorTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Carta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Motivo do envio:{' '}
                <span className="text-foreground font-medium">
                  {solicitacao.motivo === 'outro'
                    ? (solicitacao.motivoOutro ?? 'Outro')
                    : ROTULO_MOTIVO[solicitacao.motivo]}
                </span>
              </p>

              {/* A carta é o texto que chega ao cliente: tratada como citação,
                  e não como mais um campo do formulário. */}
              <blockquote className="border-primary/25 bg-muted/40 rounded-r-md border-l-2 py-3 pr-4 pl-4 text-sm leading-relaxed whitespace-pre-wrap">
                {solicitacao.mensagemCarta}
              </blockquote>

              {solicitacao.observacoes ? (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground font-ui mb-1.5 text-xs font-semibold tracking-[0.1em] uppercase">
                    Observações internas
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{solicitacao.observacoes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <LinhaDoTempo
                linhas={solicitacao.historico.map((h) => ({
                  id: h.id,
                  statusAnterior: h.statusAnterior,
                  statusNovo: h.statusNovo,
                  motivo: h.motivo,
                  criadoEm: h.criadoEm,
                  autor: h.usuario?.nome ?? 'sistema',
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{solicitacao.cliente.nome}</p>
              {pode(usuario.perfil, 'cliente.verDadosSensiveis') ? (
                <>
                  <p className="text-muted-foreground tabular-nums">
                    {formatarCpf(solicitacao.cliente.cpf)}
                  </p>
                  {solicitacao.cliente.telefone ? (
                    <p className="text-muted-foreground tabular-nums">
                      {formatarTelefone(solicitacao.cliente.telefone)}
                    </p>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Entrega</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-1 text-sm">
              <p className="text-foreground font-medium">{solicitacao.entregaDestinatario}</p>
              <p>
                {solicitacao.entregaLogradouro}, {solicitacao.entregaNumero}
                {solicitacao.entregaComplemento ? ` — ${solicitacao.entregaComplemento}` : ''}
              </p>
              <p>{solicitacao.entregaBairro}</p>
              <p>
                {solicitacao.entregaCidade}/{solicitacao.entregaUf} ·{' '}
                <span className="tabular-nums">{formatarCep(solicitacao.entregaCep)}</span>
              </p>
              <p className="border-t pt-2 text-xs">
                Endereço gravado na criação. Se o cliente se mudar, esta solicitação continua
                mostrando para onde o presente foi.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Alterar status</CardTitle>
            </CardHeader>
            <CardContent>
              {!podeAlterar ? (
                <p className="text-muted-foreground text-sm">
                  Seu perfil acompanha o status, mas não o altera.
                </p>
              ) : proximos.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {ROTULO_STATUS[solicitacao.status]} é um status final e não admite mudança.
                </p>
              ) : (
                <AConstruir>
                  <p>A partir daqui a solicitação pode ir para:</p>
                  <ul className="mt-2 space-y-1">
                    {proximos.map((status) => (
                      <li key={status} className="flex items-baseline gap-2">
                        <span className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
                        <span className="text-foreground">
                          {ROTULO_STATUS[status]}
                          {exigeMotivo(status) ? (
                            <span className="text-muted-foreground"> — exige motivo</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3">
                    As transições vêm de <code>transicoesPermitidas</code>; a gravação precisa
                    escrever a linha do histórico na mesma transação.
                  </p>
                </AConstruir>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
