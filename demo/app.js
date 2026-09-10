/**
 * Vitrine estática do Catálogo de Presentes.
 *
 * Renderização em JavaScript puro, sem build: o GitHub Pages serve os arquivos
 * como estão, e quem precisar ajustar um texto não depende de toolchain.
 *
 * O seletor "Ver como" reproduz a matriz de permissões de
 * `src/lib/permissions.ts`. É o ponto mais útil da demonstração: mostra que
 * cada perfil enxerga um conjunto diferente de telas.
 */

const PERMISSOES = {
  consultor: ['catalogo', 'nova', 'minhas'],
  admin: [
    'catalogo',
    'nova',
    'minhas',
    'gestao',
    'detalhe',
    'compras',
    'expedicao',
    'produtos',
    'clientes',
    'usuarios',
  ],
  financeiro: ['catalogo', 'gestao', 'detalhe', 'compras', 'expedicao'],
}

/** Telas que ficam sob o item "Administração", para a barra não crescer. */
const SOB_ADMINISTRACAO = ['produtos', 'clientes', 'usuarios']

const TELAS = [
  {
    id: 'catalogo',
    rotulo: 'Catálogo',
    descricao: 'Os presentes disponíveis, com valor e estoque',
  },
  {
    id: 'nova',
    rotulo: 'Nova solicitação',
    descricao: 'As cinco etapas do pedido, do cliente à revisão',
  },
  {
    id: 'minhas',
    rotulo: 'Minhas solicitações',
    descricao: 'O que o consultor pediu e o status de cada envio',
  },
  {
    id: 'compras',
    rotulo: 'Fila de compras',
    descricao: 'Itens enviados para compra, com valor e site',
  },
  {
    id: 'expedicao',
    rotulo: 'Expedição',
    descricao: 'Pedidos prontos para separar, com endereço de envio',
  },
  { id: 'gestao', rotulo: 'Gestão', descricao: 'Fluxo completo, mudança de status e exportação' },
  { id: 'produtos', rotulo: 'Produtos', descricao: 'Cadastro, edição e ativação do catálogo' },
  { id: 'clientes', rotulo: 'Clientes', descricao: 'Cadastro manual e importação por CSV' },
  { id: 'usuarios', rotulo: 'Usuários', descricao: 'Perfil de acesso e limite mensal' },
]

let perfil = 'admin'
let tela = 'catalogo'
let filtroCategoria = ''
let busca = ''

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

const totalDaSolicitacao = (s) =>
  s.itens.reduce((acc, i) => acc + i.valorUnitario * i.quantidade, 0)

function selo(status) {
  const s = STATUS[status]
  return `<span class="inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold ${s.classe}">${esc(s.rotulo)}</span>`
}

/**
 * Bloco de número. Espelha `src/components/stat.tsx`: fonte de corpo (não a de
 * título) e sem tabular-nums, que serve a coluna de tabela e não a número solto.
 */
function cartao(titulo, valor, rodape, destaque) {
  return `
    <div class="rounded-lg border bg-card p-5 shadow-[0_1px_2px_rgba(11,41,5,0.04)]">
      <p class="text-sm text-muted-foreground">${esc(titulo)}</p>
      <p class="font-body mt-1.5 font-semibold tracking-tight ${destaque ? 'text-4xl sm:text-5xl' : 'text-3xl'}">${esc(valor)}</p>
      ${rodape ? `<p class="mt-1.5 text-sm text-muted-foreground">${rodape}</p>` : ''}
    </div>`
}

function cabecalho(titulo, descricao, sobrancelha, acoes) {
  return `
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        ${sobrancelha ? `<p class="font-ui mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">${esc(sobrancelha)}</p>` : ''}
        <h1 class="font-display text-3xl font-semibold tracking-tight">${esc(titulo)}</h1>
        ${descricao ? `<p class="mt-2 max-w-prose text-sm text-muted-foreground">${esc(descricao)}</p>` : ''}
      </div>
      ${acoes ? `<div class="flex items-center gap-2">${acoes}</div>` : ''}
    </div>`
}

function emConstrucao(texto) {
  return `
    <div class="rounded-lg border border-dashed bg-muted/40 p-5 text-sm text-muted-foreground">
      <p class="font-ui mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Em construção</p>
      ${texto}
    </div>`
}

/** Barra de filtros agrupada numa superfície, como na aplicação. */
function barraDeFiltros(conteudo) {
  return `<div class="mb-6 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">${conteudo}</div>`
}

/** O olho da marca, lido do cabeçalho para não repetir o traçado no arquivo. */
function olhoPath() {
  return document.querySelector('header svg path').getAttribute('d')
}

/** Estado vazio com a marca, como em `src/components/pagina.tsx`. */
function estadoVazio(titulo, descricao) {
  return `
    <div class="flex flex-col items-center rounded-lg border bg-card px-6 py-16 text-center">
      <svg viewBox="0 0 400 250" fill="currentColor" class="w-16 text-muted-foreground/25" aria-hidden="true">
        <path d="${olhoPath()}" />
      </svg>
      <p class="font-display mt-6 text-lg font-semibold">${esc(titulo)}</p>
      ${descricao ? `<p class="mt-2 max-w-sm text-sm text-muted-foreground">${esc(descricao)}</p>` : ''}
    </div>`
}

/**
 * Ilustração do produto — mesma regra da aplicação: nome antes da categoria.
 * As formas vêm de `ilustracoes.js`, gerado de `src/lib/ilustracoes.ts`.
 */
const POR_PALAVRA = [
  [/chocolate|bombom/, 'chocolate'],
  [/espumante|champanhe/, 'espumante'],
  [/ta[çc]a/, 'taca'],
  [/difusor/, 'difusor'],
  [/caneca|x[íi]cara/, 'caneca'],
  [/cesta/, 'gourmet'],
  [/ch[áa]\b/, 'bem-estar'],
  [/livro/, 'livros'],
  [/placa|trof[ée]u/, 'placas e troféus'],
  [/vinho|whisky|gin\b/, 'vinhos e destilados'],
]

function ilustracao(nome, categoria) {
  const alvo = (nome || '').toLowerCase()
  for (const [padrao, chave] of POR_PALAVRA) {
    if (padrao.test(alvo) && ILUSTRACOES[chave]) return ILUSTRACOES[chave]
  }
  return ILUSTRACOES[(categoria || '').toLowerCase()] || ILUSTRACOES.padrao
}

function imagemDoProduto(p) {
  const foto = p.semFoto ? null : `produtos/${p.slug}.webp`

  // Moldura com proporção fixa e a imagem com width/height reais: o espaço é
  // reservado antes de a foto chegar, então nada se move ao carregar.
  const quadro = (conteudo) =>
    `<div class="relative aspect-[3/4] overflow-hidden border-b bg-muted/50 [perspective:1200px]">${conteudo}</div>`

  if (!foto) {
    return quadro(`
      <svg viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        class="h-full w-full text-primary/40 transition-transform duration-500 ease-apple group-hover:scale-105">
        ${ilustracao(p.nome, p.categoria)}
      </svg>`)
  }

  if (p.temVerso) {
    // Produto com os dois lados desenhados: a foto gira em 3D no hover.
    return quadro(`
      <div class="absolute inset-0 transition-transform duration-700 ease-apple [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] motion-reduce:transition-none">
        <img src="${foto}" alt="${esc(p.nome)}" width="900" height="1200" loading="lazy"
          class="absolute inset-0 h-full w-full object-cover [backface-visibility:hidden]" />
        <img src="produtos/${p.slug}-verso.webp" alt="${esc(p.nome)} — verso" width="900" height="1200" loading="lazy"
          class="absolute inset-0 h-full w-full object-cover [backface-visibility:hidden] [transform:rotateY(180deg)]" />
      </div>
      <span class="selo-lado pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 font-roboto text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 shrink-0">${ICONES.girar}</svg>
        <span class="group-hover:hidden">Frente</span><span class="hidden group-hover:inline">Verso</span>
      </span>`)
  }

  return quadro(`
    <img src="${foto}" alt="${esc(p.nome)}" width="900" height="1200" loading="lazy"
      class="h-full w-full object-cover transition-transform duration-500 ease-apple group-hover:scale-105" />`)
}

/** Selo de categoria — ícone e nome, como na Central. */
const TOM_DA_CATEGORIA = {
  'canecas e garrafas': 'bg-[hsl(var(--chart-1)/0.14)] text-[hsl(var(--chart-1))]',
  vestuário: 'bg-[hsl(var(--chart-5)/0.14)] text-[hsl(var(--chart-5))]',
  papelaria: 'bg-[hsl(var(--chart-4)/0.14)] text-[hsl(var(--chart-4))]',
  acessórios: 'bg-[hsl(var(--chart-2)/0.14)] text-[hsl(var(--chart-2))]',
  bebidas: 'bg-[hsl(var(--chart-3)/0.16)] text-[hsl(var(--chart-3))]',
  'casa & mesa': 'bg-[hsl(var(--chart-7)/0.16)] text-[hsl(var(--chart-7))]',
  'sacolas & caixas': 'bg-[hsl(var(--chart-8)/0.14)] text-[hsl(var(--chart-8))]',
}

function iconeSvg(chave, classe) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${classe}">${ICONES[chave] || ICONES.padrao}</svg>`
}

function categoriaBadge(categoria) {
  const chave = categoria.toLowerCase()
  const tom = TOM_DA_CATEGORIA[chave] || 'bg-muted text-muted-foreground'
  return `<span class="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-roboto text-[10px] font-bold uppercase tracking-wider ${tom}">
    ${iconeSvg(chave, 'h-3 w-3 shrink-0')}${esc(categoria)}
  </span>`
}

// --- telas ------------------------------------------------------------------

function telaCatalogo() {
  const termo = busca.trim().toLowerCase()
  const ativos = PRODUTOS.filter((p) => p.ativo)
  const visiveis = ativos.filter(
    (p) =>
      (!filtroCategoria || p.categoria === filtroCategoria) &&
      (!termo || p.nome.toLowerCase().includes(termo) || p.descricao.toLowerCase().includes(termo)),
  )

  const contagem = (cat) => ativos.filter((p) => p.categoria === cat).length

  const opcao = (rotulo, chaveIcone, valor, ativo, total) => `
    <button data-categoria="${valor}" aria-pressed="${ativo}"
      class="group flex shrink-0 items-center gap-2.5 rounded-xl border bg-card py-2 pl-2 pr-3.5 text-left transition-[border-color,box-shadow,background-color] duration-300 ease-apple ${
        ativo
          ? 'border-primary bg-primary/5 ring-2 ring-primary/25'
          : 'hover:border-primary/40 hover:shadow-sm'
      }">
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        valor === ''
          ? 'bg-primary/10 text-primary'
          : TOM_DA_CATEGORIA[valor.toLowerCase()] || 'bg-muted text-muted-foreground'
      }">${iconeSvg(valor === '' ? 'todos' : valor.toLowerCase(), 'h-4 w-4')}</span>
      <span class="min-w-0">
        <span class="block font-display text-xs font-bold leading-tight text-foreground whitespace-nowrap">${esc(rotulo)}</span>
        <span class="mt-0.5 block font-roboto text-[10px] leading-tight text-muted-foreground">${total} ${total === 1 ? 'item' : 'itens'}</span>
      </span>
    </button>`

  const filtros = [
    opcao('Todos', 'todos', '', !filtroCategoria, ativos.length),
    ...CATEGORIAS.filter((c) => contagem(c) > 0).map((c) =>
      opcao(c, c.toLowerCase(), c, filtroCategoria === c, contagem(c)),
    ),
  ].join('')

  const cards = visiveis
    .map(
      (p) => `
      <article class="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-[transform,box-shadow,border-color] duration-300 ease-apple hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
        ${imagemDoProduto(p)}
        <div class="flex flex-1 flex-col items-start gap-1.5 p-4">
          ${categoriaBadge(p.categoria)}
          <h2 class="font-display font-semibold leading-snug">${esc(p.nome)}</h2>
          <p class="line-clamp-2 font-roboto text-xs leading-relaxed text-muted-foreground">${esc(p.descricao)}</p>
          <div class="mt-auto flex w-full items-end justify-between gap-3 pt-3">
            <p class="flex items-baseline gap-1.5 leading-tight">
              ${p.tipoValor === 'medio' ? '<span class="text-xs text-muted-foreground">a partir de</span>' : ''}
              <span class="text-lg font-semibold">${brl(p.valor)}</span>
            </p>
            ${
              p.estoque !== null && p.estoque !== undefined
                ? `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">${p.estoque} un.</span>`
                : ''
            }
          </div>
        </div>
      </article>`,
    )
    .join('')

  return `
    ${cabecalho('Catálogo', 'Escolha o presente e siga para a solicitação. Produtos desativados não aparecem aqui.', 'Presentes')}
    <div class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <input id="busca" value="${esc(busca)}" placeholder="Buscar por nome ou descrição"
        class="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm" />
      <p class="ml-auto pr-1 text-sm text-muted-foreground">${visiveis.length} ${visiveis.length === 1 ? 'presente' : 'presentes'}</p>
    </div>
    <div role="group" aria-label="Filtrar por categoria" class="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">${filtros}</div>
    ${
      visiveis.length === 0
        ? estadoVazio(
            'Nenhum presente encontrado',
            'Nenhum produto ativo bate com esses filtros. Tente outra busca ou volte para “Todos”.',
          )
        : `<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${cards}</div>`
    }
    <p class="mt-6 text-xs text-muted-foreground">
      O produto desativado (“Caneca AUVP modelo descontinuado”) não aparece aqui, mas continua
      visível nas solicitações antigas — regra do modelo de dados.
    </p>`
}

/**
 * Nova solicitação.
 *
 * A vitrine mostra a etapa 2 (itens), que é a mais visual das cinco, com a
 * trilha de progresso e o resumo lateral — os mesmos de
 * `src/app/solicitacoes/nova/formulario.tsx`. O formulário é interativo no
 * sistema real; aqui ele está congelado, para caber numa página estática.
 */
function telaNova() {
  const ETAPAS = ['Cliente', 'Itens', 'Entrega', 'Carta', 'Revisão']
  const ATUAL = 1

  const trilha = ETAPAS.map((nome, i) => {
    const concluida = i < ATUAL
    const atual = i === ATUAL
    const marca = concluida
      ? '<span class="grid size-5 place-items-center rounded-full bg-success text-[10px] font-bold text-success-foreground">✓</span>'
      : `<span class="grid size-5 place-items-center rounded-full ${
          atual ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        } text-[10px] font-bold">${i + 1}</span>`

    return `
      <li class="flex items-center gap-1">
        <span class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
          atual
            ? 'bg-primary/10 font-medium text-primary-emphasis'
            : concluida
              ? 'text-muted-foreground'
              : 'text-muted-foreground/60'
        }">${marca}${esc(nome)}</span>
        ${i < ETAPAS.length - 1 ? '<span class="h-px w-5 bg-border"></span>' : ''}
      </li>`
  }).join('')

  const escolhidos = [
    { nome: 'Agenda AUVP', quantidade: 1, valor: 98.0 },
    { nome: 'Caneca AUPO11', quantidade: 2, valor: 72.0 },
  ]
  const total = escolhidos.reduce((acc, i) => acc + i.valor * i.quantidade, 0)

  const cards = PRODUTOS.filter((p) => p.ativo)
    .slice(0, 6)
    .map(
      (p) => `
      <div class="group flex flex-col overflow-hidden rounded-xl border text-left">
        ${imagemDoProduto(p)}
        <div class="flex flex-1 flex-col gap-1 p-3">
          ${categoriaBadge(p.categoria)}
          <p class="font-display text-sm font-semibold leading-snug">${esc(p.nome)}</p>
          <p class="mt-auto pt-1 text-sm font-medium">
            ${p.tipoValor === 'medio' ? '<span class="text-xs text-muted-foreground">a partir de </span>' : ''}${brl(p.valor)}
          </p>
        </div>
      </div>`,
    )
    .join('')

  const resumo = escolhidos
    .map(
      (i) => `
      <div class="flex items-start justify-between gap-3 py-2.5">
        <div class="min-w-0">
          <p class="text-sm font-medium">${esc(i.nome)}</p>
          <p class="text-xs text-muted-foreground">${i.quantidade} × ${brl(i.valor)}</p>
        </div>
        <span class="rounded-md border px-2 py-0.5 text-xs tabular-nums">${i.quantidade}</span>
      </div>`,
    )
    .join('')

  return `
    ${cabecalho('Enviar um presente', 'Cinco etapas, do cliente à revisão. Nada é enviado antes da última.', 'Nova solicitação')}

    <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div class="min-w-0">
        <ol class="mb-6 flex flex-wrap items-center gap-x-1 gap-y-2">${trilha}</ol>

        <div class="rounded-lg border bg-card p-6 shadow-[0_1px_2px_rgba(11,41,5,0.04)]">
          <p class="font-display text-lg font-semibold">O que vai no envio?</p>
          <p class="mt-1 text-sm text-muted-foreground">
            Escolha do catálogo ou descreva um presente específico com o link onde comprar.
          </p>

          <div class="mt-5 h-10 w-full rounded-md border px-3 py-2 text-sm text-muted-foreground">
            Buscar no catálogo
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>

          <div class="mt-6 rounded-lg border border-dashed p-4">
            <p class="text-sm font-medium">Presente específico</p>
            <p class="mt-1 text-xs text-muted-foreground">
              Fora do catálogo. O link é obrigatório: é por ele que o Financeiro compra.
            </p>
          </div>
        </div>
      </div>

      <aside class="h-fit rounded-lg border bg-card p-5">
        <p class="font-ui mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Resumo</p>
        <p class="text-sm font-medium">Marina Alves Pereira</p>
        <p class="text-xs text-muted-foreground">***.982.247-**</p>
        <div class="mt-3 divide-y border-t">${resumo}</div>
        <div class="mt-3 flex items-baseline justify-between border-t pt-3">
          <span class="text-sm text-muted-foreground">Total</span>
          <span class="text-lg font-semibold">${brl(total)}</span>
        </div>
      </aside>
    </div>

    <p class="mt-6 text-xs text-muted-foreground">
      O CPF deduplica o cliente na etapa 1; o CEP preenche o endereço na etapa 3; o valor de cada
      item é relido do banco e congelado na hora de gravar, para que reajuste de preço não mexa em
      solicitação já feita.
    </p>`
}

/**
 * Rota do pedido: tem o que comprar, ou já está na prateleira?
 *
 * Espelha `precisaDeCompra` de `src/lib/status.ts`. A coluna existe para que o
 * Admin decida sem abrir cada pedido.
 */
function precisaDeCompra(s) {
  return s.itens.some((i) => !i.emEstoque)
}

const ENCAMINHAVEIS = ['pendente', 'aguardando_aprovacao']

function linhasDeSolicitacao(lista, comConsultor, comSelecao) {
  return lista
    .map(
      (s) => `
    <tr class="border-b last:border-0 hover:bg-muted/40">
      ${
        comSelecao
          ? `<td class="px-4 py-3.5"><input type="checkbox" class="size-4 accent-primary align-middle" ${
              ENCAMINHAVEIS.includes(s.status) ? 'checked' : 'disabled'
            } /></td>`
          : ''
      }
      <td class="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums">
        <button data-detalhe="${esc(s.codigo)}" class="underline-offset-4 hover:text-primary-emphasis hover:underline">${esc(s.codigo)}</button>
      </td>
      <td class="whitespace-nowrap px-4 py-3.5 tabular-nums text-muted-foreground">${esc(s.data)}</td>
      ${comConsultor ? `<td class="px-4 py-3.5">${esc(s.consultor)}</td>` : ''}
      <td class="px-4 py-3.5">${esc(s.cliente)}</td>
      <td class="px-4 py-3.5 text-right tabular-nums">${s.itens.length}</td>
      <td class="whitespace-nowrap px-4 py-3.5 text-right font-medium tabular-nums">${brl(totalDaSolicitacao(s))}</td>
      ${
        comSelecao
          ? `<td class="whitespace-nowrap px-4 py-3.5">${
              ENCAMINHAVEIS.includes(s.status)
                ? `<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    precisaDeCompra(s) ? 'border text-foreground' : 'bg-muted text-muted-foreground'
                  }">${precisaDeCompra(s) ? 'compra' : 'estoque'}</span>`
                : '<span class="text-muted-foreground">—</span>'
            }</td>`
          : ''
      }
      <td class="px-4 py-3.5">
        ${selo(s.status)}
        ${s.rastreio ? `<span class="mt-0.5 block text-xs tabular-nums text-muted-foreground">${esc(s.rastreio)}</span>` : ''}
      </td>
    </tr>`,
    )
    .join('')
}

function telaMinhas() {
  const minhas = SOLICITACOES.filter((s) => s.consultor === 'Carlos Consultor')
  // Tudo entra na conta, cancelado e devolvido inclusive: a área reenvia.
  const gasto = minhas.reduce((acc, s) => acc + totalDaSolicitacao(s), 0)
  const limite = 5000
  const pct = Math.min(100, (gasto / limite) * 100)

  return `
    ${cabecalho('Solicitações', 'Os presentes que você pediu, com o status e o rastreio de cada envio.', 'Minhas solicitações')}
    <div class="mb-6 rounded-lg border bg-card p-5 shadow-sm">
      <p class="text-sm text-muted-foreground">Gasto no mês</p>
      <p class="mt-1 text-2xl font-semibold">${brl(gasto)}</p>
      <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div class="h-full bg-success" style="width:${pct}%"></div>
      </div>
      <p class="mt-2 text-sm text-muted-foreground">${brl(gasto)} de ${brl(limite)} — tudo o que foi solicitado no mês entra na conta.</p>
    </div>
    <div class="overflow-hidden rounded-lg border bg-card shadow-[0_1px_2px_rgba(11,41,5,0.04)]">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Código</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Data</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Cliente</th><th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Itens</th>
            <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Valor</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Status</th>
          </tr>
        </thead>
        <tbody>${linhasDeSolicitacao(minhas, false)}</tbody>
      </table>
    </div>`
}

function telaGestao() {
  const total = SOLICITACOES.reduce((acc, s) => acc + totalDaSolicitacao(s), 0)
  const pendentes = SOLICITACOES.filter((s) => ENCAMINHAVEIS.includes(s.status)).length

  return `
    ${cabecalho('Solicitações', 'Acompanhe o fluxo inteiro, corrija dados e exporte o resultado filtrado.', 'Gestão')}
    <div class="mb-6 flex flex-wrap items-center gap-2">
      <input placeholder="Código, cliente ou consultor" class="h-9 w-56 rounded-md border border-input px-3 text-sm" />
      <input type="date" class="h-9 rounded-md border border-input px-3 text-sm" />
      <select class="h-9 rounded-md border border-input bg-card px-3 text-sm"><option>Todos os consultores</option></select>
      <select class="h-9 rounded-md border border-input bg-card px-3 text-sm">
        <option>Todos os status</option>
        ${Object.values(STATUS)
          .map((s) => `<option>${esc(s.rotulo)}</option>`)
          .join('')}
      </select>
      <span class="ml-auto flex gap-2">
        <span class="rounded-md border bg-card px-3 py-1.5 text-sm text-muted-foreground">Exportar CSV</span>
        <span class="rounded-md border bg-card px-3 py-1.5 text-sm text-muted-foreground">Exportar XLSX</span>
      </span>
    </div>
    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      ${cartao('Solicitações no filtro', String(SOLICITACOES.length))}
      ${cartao('Valor somado', brl(total), 'Todos os status entram na conta, cancelados e devolvidos inclusive.')}
      ${cartao('Precisando de atenção', String(SOLICITACOES.filter((s) => s.status === 'deu_problema').length), 'com status “deu problema”')}
    </div>
    <div class="mb-4 flex min-h-14 flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
      <p class="text-sm font-medium">${pendentes} selecionadas</p>
      <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
        <span class="rounded-[5px] border border-primary bg-primary px-4 py-1.5 font-ui text-xs font-semibold uppercase text-primary-foreground">Aprovar e encaminhar</span>
        <span class="rounded-[5px] border bg-card px-4 py-1.5 font-ui text-xs font-semibold uppercase">Mandar comprar</span>
        <span class="rounded-[5px] border bg-card px-4 py-1.5 font-ui text-xs font-semibold uppercase">Liberar para envio</span>
      </div>
    </div>
    <div class="overflow-hidden rounded-lg border bg-card shadow-[0_1px_2px_rgba(11,41,5,0.04)]">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th class="font-ui h-11 w-10 px-4"><input type="checkbox" class="size-4 accent-primary align-middle" checked /></th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Código</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Data</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Consultor</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Cliente</th>
            <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Itens</th><th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Valor</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Rota</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Status</th>
          </tr>
        </thead>
        <tbody>${linhasDeSolicitacao(SOLICITACOES, true, true)}</tbody>
      </table>
    </div>
    <p class="mt-4 text-xs text-muted-foreground">
      O Admin trabalha por pilha: marca os pedidos acumulados e encaminha de uma vez. Quando a
      solicitação ainda está pendente, a aprovação entra como um passo antes do destino e vira uma
      linha própria do histórico — nada vai do pedido do consultor para a expedição sem o OK.
      A exportação leva o resultado inteiro do filtro, uma linha por item, para que a soma dos
      valores feche. Clique num código para ver o detalhe.
    </p>`
}

let detalheSelecionado = 'SOL-2026-0004'

function telaDetalhe() {
  const s = SOLICITACOES.find((x) => x.codigo === detalheSelecionado) ?? SOLICITACOES[0]

  const itens = s.itens
    .map(
      (i) => `
    <tr class="border-b last:border-0">
      <td class="p-3">
        ${esc(i.produto)}
        ${i.site ? `<a href="${esc(i.site)}" target="_blank" rel="noopener" class="block truncate text-xs text-muted-foreground underline underline-offset-2">${esc(i.site)}</a>` : ''}
      </td>
      <td class="p-3 text-right">${i.quantidade}</td>
      <td class="p-3 text-right">${brl(i.valorUnitario)}</td>
      <td class="p-3 text-right">${brl(i.valorUnitario * i.quantidade)}</td>
    </tr>`,
    )
    .join('')

  const historico = s.historico
    .map(
      (h) => `
    <div class="border-l-2 border-border pl-3 text-sm">
      <p>${h.de ? `${esc(h.de)} → ` : ''}<strong>${esc(h.para)}</strong></p>
      <p class="text-xs text-muted-foreground">${esc(h.quando)} · ${esc(h.quem)}</p>
      ${h.motivo ? `<p class="mt-1 text-xs text-foreground">${esc(h.motivo)}</p>` : ''}
    </div>`,
    )
    .join('')

  const outras = SOLICITACOES.map(
    (x) =>
      `<option value="${esc(x.codigo)}" ${x.codigo === s.codigo ? 'selected' : ''}>${esc(x.codigo)}</option>`,
  ).join('')

  return `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">${esc(s.codigo)}</h1>
        <p class="mt-1 text-sm text-muted-foreground">${esc(s.data)} · ${esc(s.consultor)}</p>
      </div>
      <div class="flex items-center gap-3">
        ${selo(s.status)}
        <select id="trocaDetalhe" class="h-9 rounded-md border border-input bg-card px-2 text-sm">${outras}</select>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <div class="overflow-hidden rounded-lg border bg-card shadow-[0_1px_2px_rgba(11,41,5,0.04)]">
          <div class="border-b p-4 font-medium">Itens</div>
          <table class="w-full text-sm">
            <thead class="border-b bg-muted/40 text-left text-muted-foreground">
              <tr><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Item</th><th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Qtd.</th>
              <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Unitário</th><th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Subtotal</th></tr>
            </thead>
            <tbody>
              ${itens}
              <tr><td colspan="3" class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Total</td>
              <td class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">${brl(totalDaSolicitacao(s))}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-lg border bg-card p-5">
          <p class="font-medium">Carta</p>
          <p class="mt-1 text-sm text-muted-foreground">Motivo: ${esc(s.motivo)}</p>
          <p class="mt-3 whitespace-pre-wrap text-sm">${esc(s.carta)}</p>
        </div>

        <div class="rounded-lg border bg-card p-5">
          <p class="mb-3 font-medium">Histórico</p>
          <div class="space-y-3">${historico}</div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-lg border bg-card p-5">
          <p class="font-medium">Cliente</p>
          <p class="mt-2 text-sm">${esc(s.cliente)}</p>
          <p class="text-sm text-muted-foreground">${esc(s.cpf)}</p>
        </div>
        <div class="rounded-lg border bg-card p-5">
          <p class="font-medium">Entrega</p>
          <p class="mt-2 text-sm">${esc(s.destinatario)}</p>
          <p class="text-sm text-muted-foreground">${esc(s.entrega)}</p>
        </div>
        <div class="rounded-lg border bg-card p-5">
          <p class="mb-2 font-medium">Alterar status</p>
          ${
            perfil === 'consultor'
              ? '<p class="text-sm text-muted-foreground">Seu perfil acompanha o status, mas não o altera.</p>'
              : `<p class="text-sm text-muted-foreground">A partir de <strong>${esc(STATUS[s.status].rotulo)}</strong> a solicitação pode ir para:</p>
                 <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                   ${
                     s.status === 'deu_problema'
                       ? '<li>qualquer etapa anterior do fluxo</li><li>Cancelado <span class="text-xs">(exige motivo)</span></li>'
                       : '<li>a próxima etapa do fluxo</li><li>Deu problema <span class="text-xs">(exige motivo)</span></li><li>Cancelado <span class="text-xs">(exige motivo)</span></li>'
                   }
                 </ul>`
          }
        </div>
      </div>
    </div>`
}

/**
 * Fornecedor padrão por categoria — espelha `src/lib/fornecedores.ts`.
 *
 * Bebida é sempre comprada na Casa da Bebida, por regra da área. O link do
 * presente específico vence o padrão: ele foi escolhido para aquele item.
 */
const FORNECEDOR_DA_CATEGORIA = { bebidas: 'https://casadabebida.com.br' }

function site(item) {
  const padrao = FORNECEDOR_DA_CATEGORIA[(item.categoria || '').toLowerCase()]
  const url = item.site || padrao

  if (!url) {
    return '<span class="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">catálogo</span>'
  }

  return `
    <a href="${esc(url)}" target="_blank" rel="noopener" class="block truncate underline underline-offset-2">${esc(url.replace(/^https?:\/\//, ''))}</a>
    ${item.site ? '' : `<span class="text-xs text-muted-foreground">fornecedor padrão de ${esc(item.categoria)}</span>`}`
}

function telaCompras() {
  const naFila = []
  for (const s of SOLICITACOES) {
    if (!['aguardando_compra', 'comprado'].includes(s.status)) continue
    for (const i of s.itens)
      naFila.push({
        ...i,
        codigo: s.codigo,
        data: s.data,
        consultor: s.consultor,
        cliente: s.cliente,
        status: s.status,
      })
  }
  const total = naFila.reduce((acc, i) => acc + i.valorUnitario * i.quantidade, 0)

  const linhas = naFila
    .map(
      (i) => `
    <tr class="border-b last:border-0 hover:bg-muted/40">
      <td class="whitespace-nowrap p-3">${esc(i.data)}</td>
      <td class="whitespace-nowrap p-3 font-medium">${esc(i.codigo)}</td>
      <td class="p-3">
        ${esc(i.produto)}
        <div class="text-xs text-muted-foreground">${esc(i.consultor)} · para ${esc(i.cliente)}</div>
      </td>
      <td class="max-w-xs p-3">${site(i)}</td>
      <td class="p-3 text-right">${i.quantidade}</td>
      <td class="whitespace-nowrap p-3 text-right">${brl(i.valorUnitario * i.quantidade)}</td>
      <td class="p-3">${selo(i.status)}</td>
    </tr>`,
    )
    .join('')

  return `
    ${cabecalho('Fila de compras', 'Itens das solicitações enviadas para compra, em ordem de chegada.', 'Financeiro')}
    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      ${cartao('Valor total da fila', brl(total), `${naFila.length} ${naFila.length === 1 ? 'item' : 'itens'} no total.`, true)}
      ${cartao('Aguardando compra', String(naFila.filter((i) => i.status === 'aguardando_compra').length), 'Ainda não comprados.')}
      ${cartao('Já comprados', String(naFila.filter((i) => i.status === 'comprado').length), 'Seguem visíveis até saírem para envio.')}
    </div>
    <div class="overflow-hidden rounded-lg border bg-card shadow-[0_1px_2px_rgba(11,41,5,0.04)]">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Data</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Código</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Produto</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Site</th>
            <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Qtd.</th><th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Valor</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Status</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
    <p class="mt-4 text-xs text-muted-foreground">
      Data, produto, valor e site — os campos que a área pediu. A lista é por item, e não por
      solicitação, porque a compra acontece item a item. O Financeiro também altera o status.
    </p>`
}

/**
 * Fila da expedição — a planilha que a área monta à mão hoje.
 *
 * Espelha `src/app/expedicao/page.tsx`: uma solicitação chega aqui pelo caminho
 * normal (depois da compra) ou pelo atalho (tudo em estoque, sem passar pelo
 * Financeiro). Por isso cada item diz de onde vem.
 */
function telaExpedicao() {
  const fila = SOLICITACOES.filter((s) => s.status === 'organizando_envio')
  const pecas = fila.reduce((acc, s) => acc + s.itens.reduce((n, i) => n + i.quantidade, 0), 0)
  const doEstoque = fila.reduce(
    (acc, s) => acc + s.itens.filter((i) => i.emEstoque).reduce((n, i) => n + i.quantidade, 0),
    0,
  )

  const cartoes = fila
    .map(
      (s) => `
    <div class="rounded-lg border bg-card shadow-[0_1px_2px_rgba(11,41,5,0.04)]">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b p-5">
        <div>
          <p class="font-display text-base font-semibold">${esc(s.codigo)}</p>
          <p class="mt-1 text-sm text-muted-foreground">${esc(s.data)} · ${esc(s.consultor)} · ${esc(s.motivo)}</p>
        </div>
        ${selo(s.status)}
      </div>
      <div class="grid gap-6 p-5 md:grid-cols-2">
        <div>
          <p class="font-ui mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Separar</p>
          <ul class="space-y-1.5 text-sm">
            ${s.itens
              .map(
                (i) => `
              <li class="flex items-baseline justify-between gap-3">
                <span>${i.quantidade}× ${esc(i.produto)}</span>
                <span class="rounded-full px-2 py-0.5 text-xs ${
                  i.emEstoque ? 'bg-muted text-muted-foreground' : 'border text-muted-foreground'
                }">${i.emEstoque ? 'estoque' : 'compra'}</span>
              </li>`,
              )
              .join('')}
          </ul>
          <p class="mt-3 border-t pt-3 text-xs text-muted-foreground">
            Valor da solicitação: ${brl(totalDaSolicitacao(s))}
          </p>
        </div>
        <div>
          <p class="font-ui mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Enviar para</p>
          <address class="text-sm not-italic leading-relaxed">
            <span class="font-medium">${esc(s.destinatario)}</span><br />
            ${esc(s.entrega)}
            ${s.telefone ? `<br />${esc(s.telefone)}` : ''}
          </address>
        </div>
      </div>
    </div>`,
    )
    .join('')

  return `
    ${cabecalho(
      'Pedidos para separar',
      'Tudo o que a expedição precisa para embalar e postar, em ordem de chegada. A carta continua sendo escrita fora daqui.',
      'Expedição',
      '<span class="rounded-[5px] border px-5 py-2 font-ui text-sm font-semibold uppercase">Baixar CSV</span><span class="rounded-[5px] border px-5 py-2 font-ui text-sm font-semibold uppercase">Baixar planilha</span>',
    )}
    <div class="mb-8 grid gap-4 sm:grid-cols-3">
      ${cartao('Peças a separar', String(pecas), `Em ${fila.length} ${fila.length === 1 ? 'pedido' : 'pedidos'}.`, true)}
      ${cartao('Direto do estoque', String(doEstoque), 'Não passaram pelo Financeiro.')}
      ${cartao('Compradas', String(pecas - doEstoque), 'Chegaram por uma compra do Financeiro.')}
    </div>
    ${cartoes || estadoVazio('Nada para separar agora', 'Os pedidos aparecem quando o Admin move a solicitação para organizando envio.')}
    <p class="mt-6 text-xs text-muted-foreground">
      Substitui a planilha montada à mão. Duas portas trazem uma solicitação até aqui: o caminho
      normal, depois que o Financeiro compra, e o atalho — itens já em estoque vão da aprovação
      direto para a expedição.
    </p>`
}

/** Clientes: cadastro manual e importação por CSV. */
function telaClientes() {
  const porCliente = new Map()
  for (const s of SOLICITACOES) {
    porCliente.set(s.cliente, {
      nome: s.cliente,
      cpf: s.cpf,
      telefone: s.telefone || null,
      total: (porCliente.get(s.cliente)?.total ?? 0) + 1,
    })
  }

  const linhas = [...porCliente.values()]
    .map(
      (c) => `
    <tr class="border-b last:border-0 hover:bg-muted/40">
      <td class="p-3 font-medium">${esc(c.nome)}</td>
      <td class="p-3 text-muted-foreground">${esc(c.cpf)}</td>
      <td class="p-3 text-muted-foreground">${esc(c.telefone || '—')}</td>
      <td class="p-3 text-right">${c.total}</td>
      <td class="p-3 text-right"><span class="text-xs text-muted-foreground">Editar</span></td>
    </tr>`,
    )
    .join('')

  return `
    ${cabecalho(
      'Clientes',
      'Cadastro manual ou importação por CSV. O CPF é a chave que evita duplicatas.',
      'Administração',
      '<span class="rounded-[5px] border px-5 py-2 font-ui text-sm font-semibold uppercase">Importar CSV</span><span class="rounded-[5px] border border-primary bg-primary px-5 py-2 font-ui text-sm font-semibold uppercase text-primary-foreground">Novo cliente</span>',
    )}
    <div class="overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Nome</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">CPF</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Telefone</th>
            <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Solicitações</th>
            <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Ações</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
    <p class="mt-4 text-xs text-muted-foreground">
      Na importação, linha com CPF que já existe atualiza o cadastro em vez de criar outro, e as
      linhas inválidas voltam numeradas com o motivo — sem derrubar o arquivo inteiro. Os CPFs desta
      vitrine são fictícios e aparecem mascarados.
    </p>`
}

function telaProdutos() {
  const linhas = PRODUTOS.map(
    (p) => `
    <tr class="border-b last:border-0 ${p.ativo ? '' : 'text-muted-foreground'}">
      <td class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">${esc(p.nome)}</td>
      <td class="p-3">${esc(p.categoria)}</td>
      <td class="whitespace-nowrap p-3 text-right">${p.tipoValor === 'medio' ? 'a partir de ' : ''}${brl(p.valor)}</td>
      <td class="p-3">${p.estoque ?? '—'}</td>
      <td class="p-3">
        <span class="rounded-md border px-2 py-0.5 text-xs">${p.ativo ? 'ativo' : 'desativado'}</span>
      </td>
      <td class="p-3 text-right text-xs text-muted-foreground">
        Editar · ${p.ativo ? 'Desativar' : 'Reativar'}
      </td>
    </tr>`,
  ).join('')

  return `
    ${cabecalho(
      'Gerenciar catálogo',
      'Cadastro, edição e ativação de produtos — feitos pela própria área.',
      'Administração',
      '<span class="rounded-[5px] border px-5 py-2 font-ui text-sm font-semibold uppercase">Categorias</span><span class="rounded-[5px] border border-primary bg-primary px-5 py-2 font-ui text-sm font-semibold uppercase text-primary-foreground">Novo produto</span>',
    )}
    <div class="overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Produto</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Categoria</th>
          <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Valor</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Estoque</th>
          <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Situação</th>
          <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Ações</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
    <p class="mt-4 text-xs text-muted-foreground">
      Produto nunca é excluído: a ação é desativar. O desativado some do catálogo do consultor e
      permanece nas solicitações antigas, que precisam continuar legíveis como foram criadas.
    </p>`
}

function telaUsuarios() {
  const linhas = CONSULTORES.map(
    (u) => `
    <tr class="border-b last:border-0">
      <td class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">${esc(u.nome)}</td>
      <td class="p-3"><span class="rounded-md bg-muted px-2 py-0.5 text-xs">${esc(u.perfil)}</span></td>
      <td class="whitespace-nowrap p-3 text-right">${u.limite ? brl(u.limite) : '—'}</td>
      <td class="p-3 text-right text-xs text-muted-foreground">Editar</td>
    </tr>`,
  ).join('')

  return `
    ${cabecalho('Usuários', 'Perfil e limite mensal são geridos aqui, dentro da ferramenta, sem passar por TI.', 'Administração')}
    <p class="mb-6 text-sm text-muted-foreground">
      Usuários não são criados aqui: entram sozinhos no primeiro login pelo SSO, como consultor.
      Esta tela promove, define o teto mensal e desativa quem saiu do time.
    </p>
    <div class="overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Nome</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Perfil</th>
          <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Limite mensal</th>
          <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Ações</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`
}

const RENDER = {
  catalogo: telaCatalogo,
  nova: telaNova,
  minhas: telaMinhas,
  gestao: telaGestao,
  detalhe: telaDetalhe,
  compras: telaCompras,
  expedicao: telaExpedicao,
  produtos: telaProdutos,
  clientes: telaClientes,
  usuarios: telaUsuarios,
}

// --- montagem ---------------------------------------------------------------

function render() {
  const permitidas = PERMISSOES[perfil]
  if (!permitidas.includes(tela)) tela = permitidas[0]

  const visiveis = TELAS.filter((t) => permitidas.includes(t.id))
  const principais = visiveis.filter((t) => !SOB_ADMINISTRACAO.includes(t.id))
  const administracao = visiveis.filter((t) => SOB_ADMINISTRACAO.includes(t.id))
  const adminAtivo = administracao.some((t) => t.id === tela)

  const balao = (t, ativo) => `
    <div class="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-56 -translate-x-1/2 -translate-y-[5px] opacity-0 transition-[opacity,transform] duration-200 ease-apple group-hover/item:translate-y-0 group-hover/item:opacity-100">
      <div class="bg-popover relative rounded-xl border p-3 shadow-lg">
        <div class="bg-popover absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-sm border-l border-t"></div>
        <div class="flex items-start gap-3">
          <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
            ativo ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground'
          }">${iconeSvg('tela:' + t.id, 'h-4 w-4')}</span>
          <div class="min-w-0">
            <p class="font-display text-foreground text-sm font-medium leading-tight">${esc(t.rotulo)}</p>
            <p class="text-muted-foreground font-roboto mt-0.5 text-xs leading-snug">${esc(t.descricao)}</p>
          </div>
        </div>
      </div>
    </div>`

  const itemPrincipal = (t) => {
    const ativo = t.id === tela
    return `
      <div class="group/item relative">
        <button data-tela="${t.id}" aria-current="${ativo ? 'page' : 'false'}"
          class="font-display relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-normal transition-colors duration-200 ${
            ativo ? 'text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }">
          ${esc(t.rotulo)}
          ${ativo ? '<span class="bg-foreground/30 absolute bottom-1 left-3 right-3 h-px rounded-full"></span>' : ''}
        </button>
        ${balao(t, ativo)}
      </div>`
  }

  // O submenu usa <details> nativo: abre no clique, fecha no Esc e funciona
  // pelo teclado sem nenhuma linha de JavaScript.
  const grupoAdmin = administracao.length
    ? `
      <details class="group/admin relative">
        <summary class="font-display relative flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-normal transition-colors duration-200 ${
          adminAtivo
            ? 'text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }">
          ${iconeSvg('tela:administracao', 'h-4 w-4')}
          Administração
          <span class="transition-transform duration-200 group-open/admin:rotate-180">▾</span>
          ${adminAtivo ? '<span class="bg-foreground/30 absolute bottom-1 left-3 right-3 h-px rounded-full"></span>' : ''}
        </summary>
        <div class="bg-popover absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border p-1.5 shadow-lg">
          ${administracao
            .map((t) => {
              const ativo = t.id === tela
              return `
              <button data-tela="${t.id}" class="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  ativo
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-foreground'
                }">${iconeSvg('tela:' + t.id, 'h-4 w-4')}</span>
                <span class="min-w-0 flex-1">
                  <span class="font-display text-foreground block text-sm font-bold leading-tight">${esc(t.rotulo)}</span>
                  <span class="text-muted-foreground font-roboto mt-0.5 block text-xs leading-snug">${esc(t.descricao)}</span>
                </span>
                ${ativo ? '<span class="bg-background font-roboto mt-1 shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">Atual</span>' : ''}
              </button>`
            })
            .join('')}
        </div>
      </details>`
    : ''

  document.getElementById('abas').innerHTML = principais.map(itemPrincipal).join('') + grupoAdmin

  // Reinicia a animação de entrada a cada troca de tela: recriar o elemento é
  // o que faz o navegador rodar a animação de novo. Só opacity e transform,
  // que não participam do cálculo de layout — movimento sem layout shift.
  const conteudo = document.getElementById('conteudo')
  conteudo.innerHTML = `<div class="animar-entrada">${RENDER[tela]()}</div>`
}

document.addEventListener('click', (e) => {
  const cat = e.target.closest('[data-categoria]')
  if (cat) {
    filtroCategoria = cat.dataset.categoria
    render()
    return
  }

  const aba = e.target.closest('[data-tela]')
  if (aba) {
    tela = aba.dataset.tela
    // Fecha o submenu antes de redesenhar, senão ele reabre já aberto.
    document.querySelectorAll('details[open]').forEach((d) => d.removeAttribute('open'))
    render()
    return
  }

  const detalhe = e.target.closest('[data-detalhe]')
  if (detalhe) {
    detalheSelecionado = detalhe.dataset.detalhe
    tela = 'detalhe'
    render()
  }
})

document.addEventListener('change', (e) => {
  if (e.target.id === 'perfil') {
    perfil = e.target.value
    render()
  }
  if (e.target.id === 'trocaDetalhe') {
    detalheSelecionado = e.target.value
    render()
  }
})

document.addEventListener('input', (e) => {
  if (e.target.id === 'busca') {
    busca = e.target.value
    render()
    // Reidratar o campo custa o foco e a posição do cursor; devolver os dois
    // mantém a digitação contínua.
    const campo = document.getElementById('busca')
    campo.focus()
    campo.setSelectionRange(campo.value.length, campo.value.length)
  }
})

render()
