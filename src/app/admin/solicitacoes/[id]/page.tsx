import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { formatarBRL, subtotal } from '@/lib/money'
import { formatarData, formatarDataHora } from '@/lib/datas'
import { formatarCpf } from '@/lib/cpf'
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

  return (
    <>
      <CabecalhoDaPagina
        titulo={solicitacao.codigo}
        descricao={`${formatarData(solicitacao.dataSolicitacao)} · ${solicitacao.consultor.nome}`}
        acoes={<StatusBadge status={solicitacao.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
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
                      {item.produto?.nome ?? item.descricaoLivre}
                      {item.urlExterna ? (
                        <a
                          href={item.urlExterna}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground block truncate text-xs underline underline-offset-2"
                        >
                          {item.urlExterna}
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">{formatarBRL(item.valorUnitario)}</TableCell>
                    <TableCell className="text-right">
                      {formatarBRL(subtotal(item.valorUnitario, item.quantidade))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatarBRL(solicitacao.valorTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Carta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Motivo:{' '}
                {solicitacao.motivo === 'outro'
                  ? (solicitacao.motivoOutro ?? 'Outro')
                  : ROTULO_MOTIVO[solicitacao.motivo]}
              </p>
              <p className="text-sm whitespace-pre-wrap">{solicitacao.mensagemCarta}</p>
              {solicitacao.observacoes ? (
                <p className="text-muted-foreground border-t pt-3 text-sm whitespace-pre-wrap">
                  {solicitacao.observacoes}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {solicitacao.historico.map((linha) => (
                <div key={linha.id} className="border-l-2 pl-3 text-sm">
                  <p>
                    {linha.statusAnterior ? `${ROTULO_STATUS[linha.statusAnterior]} → ` : ''}
                    <strong>{ROTULO_STATUS[linha.statusNovo]}</strong>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatarDataHora(linha.criadoEm)} · {linha.usuario?.nome ?? 'sistema'}
                  </p>
                  {linha.motivo ? <p className="mt-1 text-xs">{linha.motivo}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{solicitacao.cliente.nome}</p>
              {pode(usuario.perfil, 'cliente.verDadosSensiveis') ? (
                <>
                  <p className="text-muted-foreground">{formatarCpf(solicitacao.cliente.cpf)}</p>
                  {solicitacao.cliente.telefone ? (
                    <p className="text-muted-foreground">{solicitacao.cliente.telefone}</p>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entrega</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-1 text-sm">
              <p className="text-foreground">{solicitacao.entregaDestinatario}</p>
              <p>
                {solicitacao.entregaLogradouro}, {solicitacao.entregaNumero}
                {solicitacao.entregaComplemento ? ` — ${solicitacao.entregaComplemento}` : ''}
              </p>
              <p>{solicitacao.entregaBairro}</p>
              <p>
                {solicitacao.entregaCidade}/{solicitacao.entregaUf} ·{' '}
                {formatarCep(solicitacao.entregaCep)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alterar status</CardTitle>
            </CardHeader>
            <CardContent>
              {!pode(usuario.perfil, 'solicitacao.alterarStatus') ? (
                <p className="text-muted-foreground text-sm">
                  Seu perfil acompanha o status, mas não o altera.
                </p>
              ) : proximos.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {ROTULO_STATUS[solicitacao.status]} é um status final.
                </p>
              ) : (
                <AConstruir>
                  <p className="text-foreground font-medium">Ação em construção.</p>
                  <p className="mt-2">A partir daqui a solicitação pode ir para:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {proximos.map((status) => (
                      <li key={status}>
                        {ROTULO_STATUS[status]}
                        {exigeMotivo(status) ? ' (exige motivo)' : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    As transições vêm de <code>transicoesPermitidas</code> e a gravação precisa
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
