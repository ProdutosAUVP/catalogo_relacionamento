/**
 * Dados fictícios da vitrine.
 *
 * Espelham o seed de desenvolvimento (prisma/seed.ts) para que a demonstração
 * mostre as mesmas situações que o time encontra ao rodar o projeto: produto
 * desativado, presente específico com link, solicitações em status diferentes.
 *
 * Nenhum dado real de cliente entra aqui. Os CPFs são exibidos mascarados.
 */

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
 * repositório ProdutosAUVP/central. Espelha `prisma/seed.ts`.
 */
const PRODUTOS = [
  {
    slug: 'bourbon-auvp',
    nome: 'Licor AUVP “Punch Me Up”',
    categoria: 'Bebidas',
    valor: 189.0,
    estoque: null,
    tipoValor: 'medio',
    descricao: 'Garrafa de 700 ml com rótulo autoral, feita para as ativações e eventos.',
    ativo: true,
  },
  {
    slug: 'meia-sardinha',
    nome: 'Meia Investidor Sardinha',
    categoria: 'Vestuário',
    valor: 49.9,
    estoque: 120,
    descricao:
      'Meia vermelha com o símbolo do Investidor Sardinha no cano e recado bordado na ponta do pé.',
    ativo: true,
  },
  {
    slug: 'bone-capitalismo',
    nome: 'Boné “O capitalismo é simplesmente maravilhoso”',
    categoria: 'Vestuário',
    valor: 89.0,
    estoque: 60,
    descricao:
      'Boné vermelho com patch bordado circular — um dos brindes mais pedidos da comunidade.',
    ativo: true,
  },
  {
    slug: 'canivete-agro',
    nome: 'Canivete AUVP Agro',
    categoria: 'Acessórios',
    valor: 245.0,
    estoque: 18,
    descricao: 'Canivete com cabo de madeira e gravação AUVP Agro, entregue em caixa kraft.',
    ativo: true,
  },
  {
    slug: 'caneca-aupo11',
    nome: 'Caneca AUPO11',
    categoria: 'Canecas e garrafas',
    valor: 72.0,
    estoque: 85,
    temVerso: true,
    descricao:
      'Caneca preta com o porco coroado do AUPO11 na frente e, no verso, o recado: “Aproveite seu café com calma, seu dinheiro está no AUPO11.”',
    ativo: true,
  },
  {
    slug: 'garrafa-olho',
    nome: 'Garrafa térmica AUVP',
    categoria: 'Canecas e garrafas',
    valor: 139.0,
    estoque: 40,
    descricao: 'Garrafa térmica preta fosca com o olho AUVP aplicado em dourado.',
    ativo: true,
  },
  {
    slug: 'caneca-auvp-dourada',
    nome: 'Caneca AUVP II — grafismo dourado',
    categoria: 'Canecas e garrafas',
    valor: 68.0,
    estoque: 70,
    descricao: 'Caneca preta fosca com o grafismo de ondas concêntricas e o olho AUVP em dourado.',
    ativo: true,
  },
  {
    slug: 'caneca-porcelana',
    nome: 'Caneca AUVP I — “Coma, durma, aporte”',
    categoria: 'Canecas e garrafas',
    valor: 64.0,
    estoque: 95,
    descricao:
      'Caneca de porcelana preta com o lembrete que virou lema: “Coma, durma, aporte, pare de reclamar.”',
    ativo: true,
  },
  {
    slug: 'agenda-auvp',
    nome: 'Agenda AUVP',
    categoria: 'Papelaria',
    valor: 98.0,
    estoque: 50,
    descricao: 'Agenda preta com elástico e a frase “Projetar futuro. Realizar com consistência.”',
    ativo: true,
  },
  {
    slug: 'ecobag',
    nome: 'Ecobag “Bolsa? Só a de valores”',
    categoria: 'Sacolas & caixas',
    valor: 42.0,
    estoque: 200,
    descricao: 'Sacola de algodão preta com estampa em silk e o trocadilho da casa.',
    ativo: true,
  },
  {
    slug: 'porta-cartao-preto',
    nome: 'Porta-cartão AUVP preto',
    categoria: 'Acessórios',
    valor: 165.0,
    estoque: 25,
    descricao: 'Porta-cartão dobrável em couro preto com a marca AUVP gravada em baixo relevo.',
    ativo: true,
  },
  {
    slug: 'vela-aromatica',
    nome: 'Vela aromática AUVP',
    categoria: 'Casa & mesa',
    valor: 112.0,
    estoque: 45,
    descricao: 'Vela de flor de laranjeira (193 g) em pote de vidro com tampa dourada.',
    ativo: true,
  },
  {
    slug: 'caneca-descontinuada',
    nome: 'Caneca AUVP (modelo descontinuado)',
    categoria: 'Canecas e garrafas',
    valor: 58.0,
    estoque: null,
    semFoto: true,
    descricao: 'Modelo antigo, mantido apenas para histórico de solicitações.',
    ativo: false,
  },
]

const SOLICITACOES = [
  {
    codigo: 'SOL-2026-0001',
    data: '12/02/2026',
    consultor: 'Carlos Consultor',
    cliente: 'Marina Alves Pereira',
    cpf: '***.982.247-**',
    motivo: 'Aniversário',
    status: 'aguardando_compra',
    carta:
      'Marina, parabéns pelo seu dia! Que o novo ciclo venha cheio de conquistas. Um abraço da AUVP.',
    entrega: 'Avenida Paulista, 1000 — Apto 152, Bela Vista, São Paulo/SP · 01310-100',
    destinatario: 'Marina Alves Pereira',
    itens: [
      { produto: 'Garrafa térmica AUVP', quantidade: 1, valorUnitario: 139.0, site: null },
      { produto: 'Caneca AUPO11', quantidade: 1, valorUnitario: 72.0, site: null },
    ],
    historico: [
      {
        de: 'Aguardando aprovação',
        para: 'Aguardando compra',
        quando: '14/02/2026 09:12',
        quem: 'Bia Relacionamento',
      },
      {
        de: 'Pendente',
        para: 'Aguardando aprovação',
        quando: '12/02/2026 16:40',
        quem: 'Bia Relacionamento',
      },
      { de: null, para: 'Pendente', quando: '12/02/2026 15:02', quem: 'Carlos Consultor' },
    ],
  },
  {
    codigo: 'SOL-2026-0002',
    data: '03/02/2026',
    consultor: 'Carlos Consultor',
    cliente: 'Roberto Cardoso Lima',
    cpf: '***.444.777-**',
    motivo: 'Primeiro milhão',
    status: 'entregue',
    carta: 'Roberto, o primeiro milhão é resultado de disciplina. Parabéns por essa marca!',
    entrega: 'Avenida Atlântica, 2000, Copacabana, Rio de Janeiro/RJ · 22071-900',
    destinatario: 'Roberto Cardoso Lima',
    itens: [
      {
        produto: 'Licor AUVP “Punch Me Up”',
        quantidade: 1,
        valorUnitario: 189.0,
        site: null,
      },
      { produto: 'Porta-cartão AUVP preto', quantidade: 1, valorUnitario: 165.0, site: null },
    ],
    historico: [
      {
        de: 'Organizando envio',
        para: 'Entregue / rastreio finalizado',
        quando: '20/02/2026 11:30',
        quem: 'Bia Relacionamento',
      },
      {
        de: 'Comprado',
        para: 'Organizando envio',
        quando: '17/02/2026 14:05',
        quem: 'Bia Relacionamento',
      },
      { de: null, para: 'Pendente', quando: '03/02/2026 10:20', quem: 'Carlos Consultor' },
    ],
  },
  {
    codigo: 'SOL-2026-0003',
    data: '24/02/2026',
    consultor: 'Fernanda Consultora',
    cliente: 'Juliana Moreira Dias',
    cpf: '***.509.460-**',
    motivo: 'Nascimento',
    status: 'aguardando_compra',
    carta: 'Juliana, felicidades para a família que acaba de crescer!',
    entrega: 'Avenida Afonso Pena, 500 — Sala 12, Centro, Belo Horizonte/MG · 30130-010',
    destinatario: 'Juliana Moreira Dias',
    itens: [
      { produto: 'Vela aromática AUVP', quantidade: 1, valorUnitario: 112.0, site: null },
      {
        produto: 'Enxoval de berço bordado com o nome do bebê',
        quantidade: 1,
        valorUnitario: 450.0,
        site: 'https://www.exemplo-loja.com.br/enxoval-bordado',
      },
    ],
    historico: [
      {
        de: 'Aguardando aprovação',
        para: 'Aguardando compra',
        quando: '25/02/2026 08:45',
        quem: 'Bia Relacionamento',
      },
      { de: null, para: 'Pendente', quando: '24/02/2026 17:55', quem: 'Fernanda Consultora' },
    ],
  },
  {
    codigo: 'SOL-2026-0004',
    data: '26/02/2026',
    consultor: 'Fernanda Consultora',
    cliente: 'Marina Alves Pereira',
    cpf: '***.982.247-**',
    motivo: 'Reforço de relacionamento',
    status: 'deu_problema',
    carta: 'Marina, obrigado pela confiança de sempre.',
    entrega: 'Avenida Paulista, 1000 — Apto 152, Bela Vista, São Paulo/SP · 01310-100',
    destinatario: 'Marina Alves Pereira',
    itens: [{ produto: 'Canivete AUVP Agro', quantidade: 1, valorUnitario: 245.0, site: null }],
    historico: [
      {
        de: 'Comprado',
        para: 'Deu problema',
        quando: '28/02/2026 10:02',
        quem: 'Bia Relacionamento',
        motivo: 'Fornecedor cancelou o pedido por falta de itens da cesta.',
      },
      { de: null, para: 'Pendente', quando: '26/02/2026 09:10', quem: 'Fernanda Consultora' },
    ],
  },
]

/**
 * Cores dos status, iguais às de `src/components/status-badge.tsx`.
 *
 * cinza = não começou · âmbar = parado esperando alguém · azul = em andamento
 * verde = terminou bem · vermelho = deu errado (vazado quando já encerrado)
 */
const STATUS = {
  pendente: { rotulo: 'Pendente', classe: 'bg-muted text-muted-foreground' },
  aguardando_aprovacao: {
    rotulo: 'Aguardando aprovação',
    classe: 'bg-warning text-warning-foreground',
  },
  aguardando_compra: { rotulo: 'Aguardando compra', classe: 'bg-warning text-warning-foreground' },
  comprado: { rotulo: 'Comprado', classe: 'bg-info text-info-foreground' },
  organizando_envio: { rotulo: 'Organizando envio', classe: 'bg-info text-info-foreground' },
  entregue: {
    rotulo: 'Entregue / rastreio finalizado',
    classe: 'bg-success text-success-foreground',
  },
  cliente_confirmou: {
    rotulo: 'Cliente confirmou recebimento',
    classe: 'bg-primary text-primary-foreground',
  },
  deu_problema: { rotulo: 'Deu problema', classe: 'bg-error text-error-foreground' },
  devolvido: { rotulo: 'Devolvido', classe: 'border border-error text-error' },
  cancelado: { rotulo: 'Cancelado', classe: 'border border-border text-muted-foreground' },
}

const CONSULTORES = [
  { nome: 'Carlos Consultor', limite: 5000, perfil: 'Consultor' },
  { nome: 'Fernanda Consultora', limite: 3000, perfil: 'Consultor' },
  { nome: 'Bia Relacionamento', limite: null, perfil: 'Admin' },
  { nome: 'Financeiro AUVP', limite: null, perfil: 'Financeiro' },
]
