import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { formatarBRL } from '@/lib/money'
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
import { CabecalhoDaPagina, AConstruir } from '@/components/pagina'

/**
 * CRUD do catálogo — operado pela própria área de Relacionamento.
 *
 * Requisito de primeira ordem da spec: cadastrar, editar, ativar e desativar
 * produto sem passar pelo time técnico.
 */
export default async function AdminCatalogoPage() {
  await exigirPermissao('catalogo.gerenciar')

  const [produtos, categorias] = await Promise.all([
    db.produto.findMany({
      include: { categoria: { select: { nome: true } }, _count: { select: { itens: true } } },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    }),
    db.categoria.findMany({ orderBy: { nome: 'asc' } }),
  ])

  return (
    <>
      <CabecalhoDaPagina
        titulo="Gerenciar catálogo"
        descricao={`${produtos.length} produtos · ${categorias.length} categorias`}
      />

      <AConstruir>
        <p className="text-foreground font-medium">Formulários em construção.</p>
        <p className="mt-2">
          Faltam o cadastro e a edição de produto com upload de foto para o bucket, e o CRUD de
          categorias. As regras de validação já estão em <code>src/lib/validators/produto.ts</code>.
          Produto nunca é excluído: a ação é desativar, e o desativado some do catálogo do consultor
          mas continua nas solicitações antigas.
        </p>
      </AConstruir>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right">Usos</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  Nenhum produto cadastrado. Rode <code>npm run db:seed</code> para carregar
                  exemplos.
                </TableCell>
              </TableRow>
            ) : (
              produtos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell>{p.categoria.nome}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {p.tipoValor === 'medio' ? 'a partir de ' : ''}
                    {formatarBRL(p.valor)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.controlaEstoque ? (p.estoque ?? 0) : '—'}
                  </TableCell>
                  <TableCell className="text-right">{p._count.itens}</TableCell>
                  <TableCell>
                    <Badge variant={p.ativo ? 'secondary' : 'outline'}>
                      {p.ativo ? 'ativo' : 'desativado'}
                    </Badge>
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
