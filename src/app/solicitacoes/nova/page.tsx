import { exigirPermissao } from '@/lib/auth-guards'
import { catalogoProvider } from '@/lib/providers'
import { CabecalhoDaPagina } from '@/components/pagina'
import { FormularioDeSolicitacao, type ProdutoDoCatalogo } from './formulario'

/**
 * Nova solicitação: cliente → itens → entrega → carta → revisão.
 *
 * O catálogo vem inteiro para o cliente porque a busca da etapa 2 é local — são
 * dezenas de produtos, não milhares, e um round-trip por tecla atrapalharia
 * mais do que economizaria. `Prisma.Decimal` não atravessa a fronteira do
 * servidor, então o valor vira `number` aqui; o valor que conta é o relido do
 * banco no momento de gravar, em `criarSolicitacao`.
 */
export default async function NovaSolicitacaoPage() {
  await exigirPermissao('solicitacao.criar')

  const pagina = await catalogoProvider.listar({ apenasAtivos: true, porPagina: 500 })

  const produtos: ProdutoDoCatalogo[] = pagina.itens.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    categoriaNome: p.categoriaNome,
    fotoUrl: p.fotoUrl,
    valor: p.valor ? p.valor.toNumber() : null,
    tipoValor: p.tipoValor,
    controlaEstoque: p.controlaEstoque,
    estoque: p.estoque,
  }))

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Nova solicitação"
        titulo="Enviar um presente"
        descricao="Cinco etapas, do cliente à revisão. Nada é enviado antes da última."
      />

      <FormularioDeSolicitacao produtos={produtos} />
    </>
  )
}
