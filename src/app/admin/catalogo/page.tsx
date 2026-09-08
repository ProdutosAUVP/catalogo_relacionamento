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
import { Stat } from '@/components/stat'
import { CabecalhoDaPagina, AConstruir, EstadoVazio } from '@/components/pagina'

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

  const ativos = produtos.filter((p) => p.ativo).length

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Administração"
        titulo="Gerenciar catálogo"
        descricao="Cadastro, edição e ativação de produtos — feitos pela própria área, sem depender do time técnico."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat rotulo="Produtos ativos" valor={ativos} apoio="Visíveis para o consultor." />
        <Stat
          rotulo="Desativados"
          valor={produtos.length - ativos}
          apoio="Somem do catálogo, permanecem no histórico."
        />
        <Stat rotulo="Categorias" valor={categorias.length} />
      </div>

      <div className="mb-6">
        <AConstruir>
          <p>
            Faltam o cadastro e a edição de produto com upload de foto para o bucket, e o CRUD de
            categorias. As regras de validação já estão em{' '}
            <code>src/lib/validators/produto.ts</code>. Produto nunca é excluído: a ação é
            desativar, e o desativado some do catálogo do consultor mas continua nas solicitações
            antigas.
          </p>
        </AConstruir>
      </div>

      {produtos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum produto cadastrado"
          descricao="Rode npm run db:seed para carregar exemplos, ou cadastre o primeiro produto quando o formulário estiver pronto."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Usos</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((p) => (
                <TableRow key={p.id} className={p.ativo ? undefined : 'text-muted-foreground'}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{p.categoria.nome}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {p.tipoValor === 'medio' ? (
                      <span className="text-muted-foreground text-xs">a partir de </span>
                    ) : null}
                    {formatarBRL(p.valor)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {p.controlaEstoque ? (p.estoque ?? 0) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p._count.itens}</TableCell>
                  <TableCell>
                    <Badge variant={p.ativo ? 'outline' : 'muted'}>
                      {p.ativo ? 'ativo' : 'desativado'}
                    </Badge>
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
