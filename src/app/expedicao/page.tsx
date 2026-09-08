import { exigirPermissao } from '@/lib/auth-guards'
import { filaDeExpedicao, pecasASeparar, STATUS_DA_EXPEDICAO } from '@/lib/expedicao'
import { formatarBRL } from '@/lib/money'
import { formatarData } from '@/lib/datas'
import { ROTULO_STATUS } from '@/lib/status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { Stat } from '@/components/stat'
import { CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'

/**
 * Fila de expedição — a planilha que a área monta à mão hoje.
 *
 * Duas portas levam uma solicitação até aqui: o caminho normal, depois que o
 * Financeiro compra; e o atalho, quando os itens já estão em estoque e não há o
 * que comprar. Por isso a coluna "origem" existe em cada item: quem separa
 * precisa saber o que vem da prateleira e o que chegou de uma compra.
 *
 * O endereço aparece inteiro, e não atrás de um clique: a tela é usada com o
 * pacote na mão, e um dado de envio escondido é um dado redigitado errado.
 */
export default async function ExpedicaoPage({
  searchParams,
}: {
  searchParams: Promise<{ enviadas?: string }>
}) {
  await exigirPermissao('expedicao.verFila')
  const { enviadas } = await searchParams
  const incluirEnviadas = enviadas === '1'

  const pedidos = await filaDeExpedicao({ incluirEnviadas })
  const aSeparar = pedidos.filter((p) => p.status !== 'entregue')
  const pecas = pecasASeparar(aSeparar)
  const doEstoque = aSeparar.reduce(
    (acc, p) => acc + p.itens.filter((i) => i.jaEmEstoque).reduce((s, i) => s + i.quantidade, 0),
    0,
  )

  const query = incluirEnviadas ? '?enviadas=1' : ''

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Expedição"
        titulo="Pedidos para separar"
        descricao="Tudo o que a expedição precisa para embalar e postar, em ordem de chegada. A carta continua sendo escrita fora daqui."
        acoes={
          <>
            <Button variant="outline" asChild>
              <a href={`/api/expedicao/export${query ? `${query}&` : '?'}formato=csv`} download>
                Baixar CSV
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/api/expedicao/export${query ? `${query}&` : '?'}formato=xlsx`} download>
                Baixar planilha
              </a>
            </Button>
          </>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          destaque
          rotulo="Peças a separar"
          valor={pecas}
          apoio={`Em ${aSeparar.length} ${aSeparar.length === 1 ? 'pedido' : 'pedidos'}.`}
        />
        <Stat rotulo="Direto do estoque" valor={doEstoque} apoio="Não passaram pelo Financeiro." />
        <Stat
          rotulo="Compradas"
          valor={pecas - doEstoque}
          apoio="Chegaram por uma compra do Financeiro."
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant={incluirEnviadas ? 'outline' : 'secondary'} asChild>
          <a href="/expedicao">Só o que falta enviar</a>
        </Button>
        <Button variant={incluirEnviadas ? 'secondary' : 'outline'} asChild>
          <a href="/expedicao?enviadas=1">Incluir já enviados</a>
        </Button>
      </div>

      {pedidos.length === 0 ? (
        <EstadoVazio
          titulo="Nada para separar agora"
          descricao="Os pedidos aparecem aqui quando o Admin move a solicitação para organizando envio — seja depois da compra, seja direto da aprovação quando já há estoque."
        />
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <Card key={pedido.id}>
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-4">
                <div>
                  <CardTitle className="text-base tabular-nums">{pedido.codigo}</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatarData(pedido.data)} · {pedido.consultor} · {pedido.motivo}
                  </p>
                </div>
                <StatusBadge status={pedido.status} />
              </CardHeader>

              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground font-ui mb-2 text-xs font-semibold tracking-[0.1em] uppercase">
                    Separar
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {pedido.itens.map((item, indice) => (
                      <li
                        key={`${pedido.id}-${indice}`}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span>
                          <span className="tabular-nums">{item.quantidade}×</span> {item.produto}
                        </span>
                        <Badge variant={item.jaEmEstoque ? 'secondary' : 'outline'}>
                          {item.jaEmEstoque ? 'estoque' : 'compra'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground mt-3 border-t pt-3 text-xs">
                    Valor da solicitação: {formatarBRL(pedido.valorTotal)}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground font-ui mb-2 text-xs font-semibold tracking-[0.1em] uppercase">
                    Enviar para
                  </p>
                  {/* `select-all` porque enquanto a integração não existe estes
                      dados são copiados para o sistema da transportadora. */}
                  <address className="text-sm leading-relaxed not-italic select-all">
                    <span className="font-medium">{pedido.destinatario}</span>
                    <br />
                    {pedido.logradouro}, {pedido.numero}
                    {pedido.complemento ? ` — ${pedido.complemento}` : ''}
                    <br />
                    {pedido.bairro}
                    <br />
                    {pedido.cidade}/{pedido.uf} · <span className="tabular-nums">{pedido.cep}</span>
                    {pedido.clienteTelefone ? (
                      <>
                        <br />
                        <span className="tabular-nums">{pedido.clienteTelefone}</span>
                      </>
                    ) : null}
                  </address>

                  {pedido.observacoes ? (
                    <p className="text-muted-foreground mt-3 border-t pt-3 text-xs whitespace-pre-wrap">
                      {pedido.observacoes}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-muted-foreground mt-6 text-xs">
        A fila mostra as solicitações em{' '}
        {STATUS_DA_EXPEDICAO.map((s) => ROTULO_STATUS[s].toLowerCase()).join(' e ')}. A carta que
        acompanha o presente é escrita fora do sistema.
      </p>
    </>
  )
}
