import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
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
import { ValorDoProduto } from '@/components/valor-do-produto'
import { CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'
import { EditorDeProduto, BotaoAtivar } from './editor-de-produto'
import { EditorDeCategorias } from './editor-de-categorias'

/**
 * CRUD do catálogo: operado pela própria área de Relacionamento.
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

  // Rótulos de acompanhamento que já existem, para o cadastro sugerir em vez
  // de deixar a área digitar "vinhos" e a trava deixar de parear.
  const rotulos = [
    ...new Set(
      produtos
        .flatMap((p) => [p.exigeAcompanhamento, p.serveComoAcompanhamento])
        .filter((r): r is string => Boolean(r)),
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  // `Prisma.Decimal` não atravessa a fronteira do servidor: o valor vai como
  // texto no formato que o formulário edita.
  const opcoesDeCategoria = categorias.map((c) => ({ id: c.id, nome: c.nome, ativo: c.ativo }))

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Administração"
        titulo="Gerenciar catálogo"
        descricao="Cadastro, edição e ativação de produtos, feitos pela própria área, sem depender do time técnico."
        acoes={
          <>
            <EditorDeCategorias categorias={opcoesDeCategoria} />
            <EditorDeProduto categorias={opcoesDeCategoria} rotulos={rotulos} />
          </>
        }
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

      {produtos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum produto cadastrado"
          descricao="Cadastre o primeiro produto no botão acima, ou rode npm run db:seed para carregar exemplos."
          acao={<EditorDeProduto categorias={opcoesDeCategoria} rotulos={rotulos} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>De onde sai</TableHead>
                <TableHead className="text-right">Usos</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((p) => (
                <TableRow key={p.id} className={p.ativo ? undefined : 'text-muted-foreground'}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{p.categoria.nome}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    <ValorDoProduto valor={p.valor} tipoValor={p.tipoValor} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={p.origem === 'estoque_interno' ? 'muted' : 'outline'}>
                      {p.origem === 'estoque_interno' ? 'estoque' : 'sob pedido'}
                    </Badge>
                    {p.controlaEstoque ? (
                      <span className="text-muted-foreground ml-2 text-xs tabular-nums">
                        {p.estoque ?? 0} un.
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p._count.itens}</TableCell>
                  <TableCell>
                    <Badge variant={p.ativo ? 'outline' : 'muted'}>
                      {p.ativo ? 'ativo' : 'desativado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <EditorDeProduto
                      categorias={opcoesDeCategoria}
                      rotulos={rotulos}
                      produto={{
                        id: p.id,
                        nome: p.nome,
                        descricao: p.descricao,
                        categoriaId: p.categoriaId,
                        fotoUrl: p.fotoUrl,
                        valor: p.valor ? p.valor.toFixed(2).replace('.', ',') : '',
                        tipoValor: p.tipoValor,
                        origem: p.origem,
                        controlaEstoque: p.controlaEstoque,
                        estoque: p.estoque,
                        urlCompra: p.urlCompra,
                        notaDeCompra: p.notaDeCompra,
                        exigeAcompanhamento: p.exigeAcompanhamento,
                        serveComoAcompanhamento: p.serveComoAcompanhamento,
                        ativo: p.ativo,
                        skuTiny: p.skuTiny,
                      }}
                    />
                    <BotaoAtivar id={p.id} ativo={p.ativo} />
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
