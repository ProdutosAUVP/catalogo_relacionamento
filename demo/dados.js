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
  'Vinhos e destilados',
  'Casa e decoração',
  'Livros',
  'Gourmet',
  'Bem-estar',
  'Placas e troféus',
]

const PRODUTOS = [
  {
    nome: 'Vinho tinto Malbec reserva',
    categoria: 'Vinhos e destilados',
    valor: 189.9,
    estoque: 24,
    descricao: 'Garrafa 750ml, safra selecionada, com caixa de presente.',
    ativo: true,
  },
  {
    nome: 'Espumante brut nacional',
    categoria: 'Vinhos e destilados',
    valor: 129.0,
    estoque: 40,
    descricao: 'Garrafa 750ml em embalagem individual.',
    ativo: true,
  },
  {
    nome: 'Kit de taças de cristal',
    categoria: 'Casa e decoração',
    valor: 245.0,
    estoque: 12,
    descricao: 'Duas taças de cristal com gravação opcional.',
    ativo: true,
  },
  {
    nome: 'Difusor de ambiente',
    categoria: 'Casa e decoração',
    valor: 98.5,
    estoque: 30,
    descricao: 'Difusor 250ml com varetas, fragrância amadeirada.',
    ativo: true,
  },
  {
    nome: 'Livro — O Investidor Inteligente',
    categoria: 'Livros',
    valor: 89.9,
    estoque: 50,
    descricao: 'Edição capa dura, clássico de Benjamin Graham.',
    ativo: true,
  },
  {
    nome: 'Cesta gourmet completa',
    categoria: 'Gourmet',
    valor: 320.0,
    estoque: null,
    tipoValor: 'medio',
    descricao: 'Cesta com azeite, geleias, castanhas, café especial e biscoitos.',
    ativo: true,
  },
  {
    nome: 'Caixa de chocolates belgas',
    categoria: 'Gourmet',
    valor: 156.0,
    estoque: 18,
    descricao: 'Caixa com 24 bombons sortidos.',
    ativo: true,
  },
  {
    nome: 'Kit de chá premium',
    categoria: 'Bem-estar',
    valor: 142.0,
    estoque: 15,
    descricao: 'Seleção de seis chás em lata, com infusor.',
    ativo: true,
  },
  {
    nome: 'Placa comemorativa primeiro milhão',
    categoria: 'Placas e troféus',
    valor: 380.0,
    estoque: null,
    tipoValor: 'medio',
    descricao: 'Placa em acrílico com gravação personalizada do nome do cliente.',
    ativo: true,
  },
  {
    nome: 'Caneca personalizada (descontinuada)',
    categoria: 'Casa e decoração',
    valor: 65.0,
    estoque: null,
    descricao: 'Modelo antigo, mantido apenas para histórico.',
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
      { produto: 'Vinho tinto Malbec reserva', quantidade: 1, valorUnitario: 189.9, site: null },
      { produto: 'Caixa de chocolates belgas', quantidade: 1, valorUnitario: 156.0, site: null },
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
        produto: 'Placa comemorativa primeiro milhão',
        quantidade: 1,
        valorUnitario: 380.0,
        site: null,
      },
      { produto: 'Espumante brut nacional', quantidade: 1, valorUnitario: 129.0, site: null },
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
      { produto: 'Kit de chá premium', quantidade: 1, valorUnitario: 142.0, site: null },
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
    itens: [{ produto: 'Cesta gourmet completa', quantidade: 1, valorUnitario: 320.0, site: null }],
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
