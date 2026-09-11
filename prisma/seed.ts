import { existsSync, readdirSync } from 'node:fs'
import { PrismaClient, MotivoEnvio, Perfil, StatusSolicitacao, TipoValor } from '@prisma/client'
import { formatarCodigo } from '../src/lib/codigo'
import { totalDosItens } from '../src/lib/money'
import { CATALOGO_AUVP, CATEGORIAS_AUVP, slugDoProduto } from './catalogo-auvp'

/**
 * Carga inicial do banco.
 *
 * O catálogo **não é exemplo**: são os 49 presentes que a área mantém hoje,
 * transcritos da planilha dela em `prisma/catalogo-auvp.ts`. Depois que a
 * ferramenta estiver no ar, quem manda é o CRUD de catálogo — este arquivo é o
 * ponto de partida.
 *
 * O resto (usuários, clientes e algumas solicitações) é exemplo mesmo, para
 * que quem clonar o repositório abra as telas com conteúdo plausível:
 * solicitações em status diferentes e uma com presente específico com link.
 *
 * O seed é idempotente: roda quantas vezes precisar sem duplicar.
 */

const db = new PrismaClient()

/**
 * O catálogo real da área vive em `prisma/catalogo-auvp.ts`, transcrito da
 * planilha "Lista de Produtos". Aqui só se grava.
 */
const USUARIOS = [
  { nome: 'Bia Relacionamento', email: 'bia@auvp.com.br', perfil: Perfil.admin },
  { nome: 'Financeiro AUVP', email: 'financeiro@auvp.com.br', perfil: Perfil.financeiro },
  {
    nome: 'Carlos Consultor',
    email: 'carlos@auvp.com.br',
    perfil: Perfil.consultor,
    limiteMensal: '5000.00',
  },
  {
    nome: 'Fernanda Consultora',
    email: 'fernanda@auvp.com.br',
    perfil: Perfil.consultor,
    limiteMensal: '3000.00',
  },
]

// CPFs com dígitos verificadores válidos — a validação recusaria fictícios.
const CLIENTES = [
  { nome: 'Marina Alves Pereira', cpf: '52998224725', telefone: '11987654321' },
  { nome: 'Roberto Cardoso Lima', cpf: '11144477735', telefone: '21987651234' },
  { nome: 'Juliana Moreira Dias', cpf: '15350946056', telefone: '31988776655' },
]

async function main() {
  console.log('Semeando o banco...')

  const categorias = new Map<string, string>()
  for (const nome of CATEGORIAS_AUVP) {
    const c = await db.categoria.upsert({
      where: { nome },
      create: { nome },
      update: {},
    })
    categorias.set(nome, c.id)
  }
  console.log(`  ${categorias.size} categorias`)

  // Quais fotos existem de fato, para não gravar caminho de arquivo ausente.
  const fotos = new Set(
    existsSync('public/produtos')
      ? readdirSync('public/produtos')
          .filter((f) => f.endsWith('.webp'))
          .map((f) => f.replace(/\.webp$/, ''))
      : [],
  )

  const produtos = new Map<string, { id: string; valor: string | null }>()
  for (const p of CATALOGO_AUVP) {
    const existente = await db.produto.findFirst({ where: { nome: p.nome } })
    const dados = {
      nome: p.nome,
      categoriaId: categorias.get(p.categoria)!,
      // A foto é servida do próprio domínio, de `public/produtos/`, preparada
      // por `scripts/preparar-fotos.ts` a partir de `imgs produtos/`. Produto
      // sem arquivo fica nulo e o catálogo desenha a ilustração da categoria.
      fotoUrl: fotos.has(slugDoProduto(p.nome)) ? `/produtos/${slugDoProduto(p.nome)}.webp` : null,
      valor: p.valor,
      tipoValor: p.tipoValor ?? TipoValor.exato,
      origem: p.origem,
      // A planilha não conta peças: "Estoque interno" é a prateleira, e é a
      // origem que decide se passa pelo Financeiro.
      controlaEstoque: false,
      estoque: null,
      urlCompra: p.urlCompra ?? null,
      notaDeCompra: p.notaDeCompra ?? null,
      ativo: true,
    }

    const produto = existente
      ? await db.produto.update({ where: { id: existente.id }, data: dados })
      : await db.produto.create({ data: dados })

    produtos.set(p.nome, { id: produto.id, valor: p.valor })
  }
  console.log(`  ${produtos.size} produtos`)

  const usuarios = new Map<string, string>()
  for (const u of USUARIOS) {
    const usuario = await db.usuario.upsert({
      where: { email: u.email },
      create: { nome: u.nome, email: u.email, perfil: u.perfil, limiteMensal: u.limiteMensal },
      update: { nome: u.nome, perfil: u.perfil, limiteMensal: u.limiteMensal },
    })
    usuarios.set(u.email, usuario.id)
  }
  console.log(`  ${usuarios.size} usuários`)

  const clientes = new Map<string, string>()
  for (const c of CLIENTES) {
    const cliente = await db.cliente.upsert({
      where: { cpf: c.cpf },
      create: { ...c, criadoPor: usuarios.get('carlos@auvp.com.br') },
      update: { nome: c.nome, telefone: c.telefone },
    })
    clientes.set(c.cpf, cliente.id)
  }
  console.log(`  ${clientes.size} clientes`)

  // Solicitações de exemplo, uma por situação interessante.
  //
  // Os tipos são explícitos porque um array literal heterogêneo faria o
  // TypeScript inferir uma união frouxa, e a narrowing por `'produto' in item`
  // deixaria de funcionar.
  type ItemExemplo =
    | { produto: string; quantidade: number }
    | { descricaoLivre: string; urlExterna: string; valorUnitario: string; quantidade: number }

  type SolicitacaoExemplo = {
    consultor: string
    cliente: string
    motivo: MotivoEnvio
    status: StatusSolicitacao
    mensagemCarta: string
    itens: ItemExemplo[]
    entrega: {
      entregaCep: string
      entregaLogradouro: string
      entregaNumero: string
      entregaComplemento: string | null
      entregaBairro: string
      entregaCidade: string
      entregaUf: string
      entregaDestinatario: string
    }
  }

  const exemplos: SolicitacaoExemplo[] = [
    {
      consultor: 'carlos@auvp.com.br',
      cliente: '52998224725',
      motivo: MotivoEnvio.aniversario,
      status: StatusSolicitacao.aguardando_compra,
      mensagemCarta:
        'Marina, parabéns pelo seu dia! Que o novo ciclo venha cheio de conquistas. Um abraço da AUVP.',
      itens: [
        // Duas bebidas: compradas sob demanda, então esta vai ao Financeiro.
        { produto: 'Vinho Silk & Spice', quantidade: 1 },
        { produto: 'Kit Café Constantino', quantidade: 1 },
      ],
      entrega: {
        entregaCep: '01310100',
        entregaLogradouro: 'Avenida Paulista',
        entregaNumero: '1000',
        entregaComplemento: 'Apto 152',
        entregaBairro: 'Bela Vista',
        entregaCidade: 'São Paulo',
        entregaUf: 'SP',
        entregaDestinatario: 'Marina Alves Pereira',
      },
    },
    {
      consultor: 'carlos@auvp.com.br',
      cliente: '11144477735',
      motivo: MotivoEnvio.primeiro_milhao,
      status: StatusSolicitacao.entregue,
      mensagemCarta:
        'Roberto, o primeiro milhão é resultado de disciplina. Parabéns por essa marca!',
      itens: [
        { produto: 'Whisky Woodford Reserve Bourbon', quantidade: 1 },
        { produto: 'Carteira AUVP', quantidade: 1 },
      ],
      entrega: {
        entregaCep: '22071900',
        entregaLogradouro: 'Avenida Atlântica',
        entregaNumero: '2000',
        entregaComplemento: null,
        entregaBairro: 'Copacabana',
        entregaCidade: 'Rio de Janeiro',
        entregaUf: 'RJ',
        entregaDestinatario: 'Roberto Cardoso Lima',
      },
    },
    {
      consultor: 'fernanda@auvp.com.br',
      cliente: '15350946056',
      motivo: MotivoEnvio.nascimento,
      status: StatusSolicitacao.aguardando_compra,
      mensagemCarta: 'Juliana, felicidades para a família que acaba de crescer!',
      itens: [
        { produto: 'Kit Presente Granado', quantidade: 1 },
        // Presente específico: fora do catálogo, com link onde comprar.
        {
          descricaoLivre: 'Enxoval de berço bordado com o nome do bebê',
          urlExterna: 'https://www.exemplo-loja.com.br/enxoval-bordado',
          valorUnitario: '450.00',
          quantidade: 1,
        },
      ],
      entrega: {
        entregaCep: '30130010',
        entregaLogradouro: 'Avenida Afonso Pena',
        entregaNumero: '500',
        entregaComplemento: 'Sala 12',
        entregaBairro: 'Centro',
        entregaCidade: 'Belo Horizonte',
        entregaUf: 'MG',
        entregaDestinatario: 'Juliana Moreira Dias',
      },
    },
  ]

  let criadas = 0
  for (const [indice, exemplo] of exemplos.entries()) {
    const codigo = formatarCodigo(new Date().getFullYear(), indice + 1)
    if (await db.solicitacao.findUnique({ where: { codigo } })) continue

    const itens = exemplo.itens.map((item) => {
      if ('produto' in item) {
        const p = produtos.get(item.produto)!
        return {
          produtoId: p.id,
          descricaoLivre: null,
          urlExterna: null,
          // O valor é congelado na criação, e não lido do produto depois.
          // Produto sem preço na planilha congela como zero — o mesmo que
          // `criarSolicitacao` faz.
          valorUnitario: p.valor ?? '0',
          quantidade: item.quantidade,
        }
      }
      return {
        produtoId: null,
        descricaoLivre: item.descricaoLivre,
        urlExterna: item.urlExterna,
        valorUnitario: item.valorUnitario,
        quantidade: item.quantidade,
      }
    })

    await db.$transaction(async (tx) => {
      await tx.contadorCodigo.upsert({
        where: { ano: new Date().getFullYear() },
        create: { ano: new Date().getFullYear(), valor: indice + 1 },
        update: { valor: indice + 1 },
      })

      const solicitacao = await tx.solicitacao.create({
        data: {
          codigo,
          consultorId: usuarios.get(exemplo.consultor)!,
          clienteId: clientes.get(exemplo.cliente)!,
          motivo: exemplo.motivo,
          mensagemCarta: exemplo.mensagemCarta,
          status: exemplo.status,
          valorTotal: totalDosItens(itens).toString(),
          ...exemplo.entrega,
          itens: { create: itens },
        },
      })

      // Toda solicitação nasce com a linha de abertura no histórico.
      await tx.solicitacaoHistorico.create({
        data: {
          solicitacaoId: solicitacao.id,
          statusAnterior: null,
          statusNovo: StatusSolicitacao.pendente,
          usuarioId: usuarios.get(exemplo.consultor)!,
        },
      })

      if (exemplo.status !== StatusSolicitacao.pendente) {
        await tx.solicitacaoHistorico.create({
          data: {
            solicitacaoId: solicitacao.id,
            statusAnterior: StatusSolicitacao.pendente,
            statusNovo: exemplo.status,
            usuarioId: usuarios.get('bia@auvp.com.br')!,
          },
        })
      }
    })

    criadas++
  }
  console.log(`  ${criadas} solicitações`)
  console.log('Pronto.')
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
