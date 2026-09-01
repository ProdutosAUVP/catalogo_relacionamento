import { exigirPermissao } from '@/lib/auth-guards'
import { filaDeCompras, totalDaFila, STATUS_DA_FILA_DE_COMPRAS } from '@/lib/compras'
import { formatarBRL } from '@/lib/money'
import { formatarData } from '@/lib/datas'
import { Badge } from '@/components/ui/badge'
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
        titulo="Fila de compras"
        descricao="Itens das solicitações enviadas para compra."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Aguardando compra</CardDescription>
            <CardTitle className="text-2xl">{aguardando.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Itens na fila</CardDescription>
            <CardTitle className="text-2xl">{itens.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Valor total</CardDescription>
            <CardTitle className="text-2xl">{formatarBRL(total)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {itens.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Nenhum item na fila. Solicitações aparecem aqui quando entram em{' '}
            <strong>aguardando compra</strong>.
          </CardContent>
        </Card>
      ) : (
        <Card>
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
                  <TableCell className="whitespace-nowrap">{formatarData(item.data)}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{item.codigo}</TableCell>
                  <TableCell>
                    <div>{item.produto}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.consultorNome} · para {item.clienteNome}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64">
                    {item.site ? (
                      <a
                        href={item.site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate underline underline-offset-2"
                      >
                        {item.site}
                      </a>
                    ) : (
                      // Item de catálogo não tem site: é comprado pelo canal
                      // já estabelecido. Mostrar a categoria é mais útil que um traço.
                      <Badge variant="outline">{item.categoria ?? 'catálogo'}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.quantidade}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
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
        A fila mostra os status {STATUS_DA_FILA_DE_COMPRAS.join(' e ')}. A alteração de status é
        feita no detalhe da solicitação.
      </p>
    </>
  )
}
