import { PrismaClient, MotivoEnvio, Perfil, StatusSolicitacao, TipoValor } from '@prisma/client'
import { formatarCodigo } from '../src/lib/codigo'
import { totalDosItens } from '../src/lib/money'

/**
 * Dados de desenvolvimento.
 *
 * O objetivo é que quem clonar o repositório abra as telas com conteúdo
 * plausível: catálogo com categorias variadas, um produto desativado (para ver
 * que ele some do catálogo mas continua na solicitação antiga), solicitações em
 * status diferentes e uma com item específico com link.
 *
 * O seed é idempotente: roda quantas vezes precisar sem duplicar.
 */

const db = new PrismaClient()

const CATEGORIAS = [
  'Bebidas',
  'Vestuário',
  'Acessórios',
  'Canecas e garrafas',
  'Papelaria',
  'Sacolas & caixas',
  'Casa & mesa',
]

/**
 * Catálogo real: os brindes físicos da AUVP, com as fotos de estúdio do
 * repositório ProdutosAUVP/central. Nome, descrição e categoria vêm de lá
 * (`src/data/produtosFisicos.ts`); valor e estoque são plausíveis e existem
 * para as telas terem número — a área ajusta no CRUD de catálogo.
 *
 * `slug` casa com o arquivo em `public/produtos/<slug>.webp`.
 */
const PRODUTOS: {
  slug: string
  nome: string
  descricao: string
  categoria: string
  valor: string
  tipoValor?: TipoValor
  controlaEstoque: boolean
  estoque?: number
  ativo?: boolean
  /** Sem arquivo em public/produtos: a tela cai na ilustração da categoria. */
  semFoto?: boolean
}[] = [
  {
    slug: 'bourbon-auvp',
    nome: 'Licor AUVP “Punch Me Up”',
    descricao: 'Garrafa de 700 ml com rótulo autoral, feita para as ativações e eventos.',
    categoria: 'Bebidas',
    valor: '189.00',
    tipoValor: TipoValor.medio,
    controlaEstoque: false,
  },
  {
    slug: 'meia-sardinha',
    nome: 'Meia Investidor Sardinha',
    descricao:
      'Meia vermelha com o símbolo do Investidor Sardinha no cano e recado bordado na ponta do pé.',
    categoria: 'Vestuário',
    valor: '49.90',
    controlaEstoque: true,
    estoque: 120,
  },
  {
    slug: 'bone-capitalismo',
    nome: 'Boné “O capitalismo é simplesmente maravilhoso”',
    descricao:
      'Boné vermelho com patch bordado circular — um dos brindes mais pedidos da comunidade.',
    categoria: 'Vestuário',
    valor: '89.00',
    controlaEstoque: true,
    estoque: 60,
  },
  {
    slug: 'canivete-agro',
    nome: 'Canivete AUVP Agro',
    descricao: 'Canivete com cabo de madeira e gravação AUVP Agro, entregue em caixa kraft.',
    categoria: 'Acessórios',
    valor: '245.00',
    controlaEstoque: true,
    estoque: 18,
  },
  {
    slug: 'caneca-aupo11',
    nome: 'Caneca AUPO11',
    descricao:
      'Caneca preta com o porco coroado do AUPO11 na frente e, no verso, o recado: “Aproveite seu café com calma, seu dinheiro está no AUPO11.”',
    categoria: 'Canecas e garrafas',
    valor: '72.00',
    controlaEstoque: true,
    estoque: 85,
  },
  {
    slug: 'garrafa-olho',
    nome: 'Garrafa térmica AUVP',
    descricao: 'Garrafa térmica preta fosca com o olho AUVP aplicado em dourado.',
    categoria: 'Canecas e garrafas',
    valor: '139.00',
    controlaEstoque: true,
    estoque: 40,
  },
  {
    slug: 'caneca-auvp-dourada',
    nome: 'Caneca AUVP II — grafismo dourado',
    descricao: 'Caneca preta fosca com o grafismo de ondas concêntricas e o olho AUVP em dourado.',
    categoria: 'Canecas e garrafas',
    valor: '68.00',
    controlaEstoque: true,
    estoque: 70,
  },
  {
    slug: 'caneca-porcelana',
    nome: 'Caneca AUVP I — “Coma, durma, aporte”',
    descricao:
      'Caneca de porcelana preta com o lembrete que virou lema: “Coma, durma, aporte, pare de reclamar.”',
    categoria: 'Canecas e garrafas',
    valor: '64.00',
    controlaEstoque: true,
    estoque: 95,
  },
  {
    slug: 'agenda-auvp',
    nome: 'Agenda AUVP',
    descricao: 'Agenda preta com elástico e a frase “Projetar futuro. Realizar com consistência.”',
    categoria: 'Papelaria',
    valor: '98.00',
    controlaEstoque: true,
    estoque: 50,
  },
  {
    slug: 'ecobag',
    nome: 'Ecobag “Bolsa? Só a de valores”',
    descricao: 'Sacola de algodão preta com estampa em silk e o trocadilho da casa.',
    categoria: 'Sacolas & caixas',
    valor: '42.00',
    controlaEstoque: true,
    estoque: 200,
  },
  {
    slug: 'porta-cartao-preto',
    nome: 'Porta-cartão AUVP preto',
    descricao: 'Porta-cartão dobrável em couro preto com a marca AUVP gravada em baixo relevo.',
    categoria: 'Acessórios',
    valor: '165.00',
    controlaEstoque: true,
    estoque: 25,
  },
  {
    slug: 'vela-aromatica',
    nome: 'Vela aromática AUVP',
    descricao: 'Vela de flor de laranjeira (193 g) em pote de vidro com tampa dourada.',
    categoria: 'Casa & mesa',
    valor: '112.00',
    controlaEstoque: true,
    estoque: 45,
  },
  {
    slug: 'caneca-porcelana-antiga',
    nome: 'Caneca AUVP (modelo descontinuado)',
    descricao: 'Modelo antigo, mantido apenas para histórico de solicitações.',
    categoria: 'Canecas e garrafas',
    valor: '58.00',
    controlaEstoque: false,
    semFoto: true,
    // Desativado de propósito: deve sumir do catálogo e permanecer nas
    // solicitações antigas.
    ativo: false,
  },
]

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
  for (const nome of CATEGORIAS) {
    const c = await db.categoria.upsert({
      where: { nome },
      create: { nome },
      update: {},
    })
    categorias.set(nome, c.id)
  }
  console.log(`  ${categorias.size} categorias`)

  const produtos = new Map<string, { id: string; valor: string }>()
  for (const p of PRODUTOS) {
    const existente = await db.produto.findFirst({ where: { nome: p.nome } })
    const dados = {
      nome: p.nome,
      descricao: p.descricao,
      categoriaId: categorias.get(p.categoria)!,
      // A foto é servida do próprio domínio, de `public/produtos/`. Quando o
      // upload para o bucket existir, este campo passa a receber a URL de lá.
      fotoUrl: p.semFoto ? null : `/produtos/${p.slug}.webp`,
      valor: p.valor,
      tipoValor: p.tipoValor ?? TipoValor.exato,
      controlaEstoque: p.controlaEstoque ?? false,
      estoque: p.controlaEstoque ? (p.estoque ?? 0) : null,
      ativo: p.ativo ?? true,
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
        { produto: 'Garrafa térmica AUVP', quantidade: 1 },
        { produto: 'Caneca AUPO11', quantidade: 1 },
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
        { produto: 'Licor AUVP “Punch Me Up”', quantidade: 1 },
        { produto: 'Porta-cartão AUVP preto', quantidade: 1 },
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
        { produto: 'Vela aromática AUVP', quantidade: 1 },
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
          valorUnitario: p.valor,
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
