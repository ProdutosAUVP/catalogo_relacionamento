import { exigirPermissao } from '@/lib/auth-guards'
import { filaDeCompras, totalDaFila, STATUS_DA_FILA_DE_COMPRAS } from '@/lib/compras'
import { siteDeCompra } from '@/lib/fornecedores'
import { formatarBRL } from '@/lib/money'
import { formatarData } from '@/lib/datas'
import { ROTULO_STATUS } from '@/lib/status'
import { Badge } from '@/components/ui/badge'
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
 * Fila de compras — tela do perfil Financeiro.
 *
 * A área definiu o conteúdo: as solicitações enviadas para compra, com data,
 * produto, valor e site. É uma lista por item, e não por solicitação, porque a
 * compra acontece item a item: um pedido com três presentes pode ter três
 * origens diferentes.
 */
export default async function FilaDeComprasPage() {
  await exigirPermissao('compras.verFila')

  const itens = await filaDeCompras()
  const total = totalDaFila(itens)
  const aguardando = itens.filter((i) => i.status === 'aguardando_compra')

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Financeiro"
        titulo="Fila de compras"
        descricao="Itens das solicitações enviadas para compra, em ordem de chegada."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          destaque
          rotulo="Valor total da fila"
          valor={formatarBRL(total)}
          apoio={`${itens.length} ${itens.length === 1 ? 'item' : 'itens'} no total.`}
        />
        <Stat rotulo="Aguardando compra" valor={aguardando.length} apoio="Ainda não comprados." />
        <Stat
          rotulo="Já comprados"
          valor={itens.length - aguardando.length}
          apoio="Seguem visíveis até saírem para envio."
        />
      </div>

      {itens.length === 0 ? (
        <EstadoVazio
          titulo="Nada para comprar agora"
          descricao="As solicitações aparecem aqui assim que o Admin as move para aguardando compra."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
                    {formatarData(item.data)}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap tabular-nums">
                    {item.codigo}
                  </TableCell>
                  <TableCell className="min-w-56">
                    <div className="font-medium">{item.produto}</div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {item.consultorNome} · para {item.clienteNome}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <SiteDeCompra site={item.site} categoria={item.categoria} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantidade}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                    {formatarBRL(item.valor)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-muted-foreground mt-4 text-xs">
        A fila mostra as solicitações em{' '}
        {STATUS_DA_FILA_DE_COMPRAS.map((s) => ROTULO_STATUS[s].toLowerCase()).join(' e ')}. A
        alteração de status é feita no detalhe da solicitação.
      </p>
    </>
  )
}

/**
 * Onde comprar o item.
 *
 * O link do presente específico vence; sem ele, vale o fornecedor padrão da
 * categoria (bebida é sempre Casa da Bebida, por regra da área). Sobrando as
 * duas coisas, mostra-se a categoria — que informa mais que um traço.
 */
function SiteDeCompra({ site, categoria }: { site: string | null; categoria: string | null }) {
  const destino = siteDeCompra(site, categoria)

  if (!destino) return <Badge variant="outline">{categoria ?? 'catálogo'}</Badge>

  return (
    <>
      <a
        href={destino.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-emphasis block truncate text-sm underline-offset-4 hover:underline"
      >
        {destino.url.replace(/^https?:\/\//, '')}
      </a>
      {destino.origem === 'categoria' ? (
        <span className="text-muted-foreground text-xs">fornecedor padrão de {categoria}</span>
      ) : null}
    </>
  )
}
