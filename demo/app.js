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
  admin: ['catalogo', 'nova', 'minhas', 'gestao', 'detalhe', 'compras', 'produtos', 'usuarios'],
  financeiro: ['catalogo', 'gestao', 'detalhe', 'compras'],
}

const TELAS = [
  { id: 'catalogo', rotulo: 'Catálogo' },
  { id: 'nova', rotulo: 'Nova solicitação' },
  { id: 'minhas', rotulo: 'Minhas solicitações' },
  { id: 'compras', rotulo: 'Fila de compras' },
  { id: 'gestao', rotulo: 'Gestão' },
  { id: 'detalhe', rotulo: 'Detalhe' },
  { id: 'produtos', rotulo: 'Gerenciar catálogo' },
  { id: 'usuarios', rotulo: 'Usuários' },
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

function imagemDoProduto(nome, categoria) {
  return `
    <div class="aspect-[4/3] w-full bg-gradient-to-br from-muted to-accent/8">
      <svg viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        class="h-full w-full text-primary/45 transition-colors duration-300 group-hover:text-primary/70">
        ${ilustracao(nome, categoria)}
      </svg>
    </div>`
}

// --- telas ------------------------------------------------------------------

function telaCatalogo() {
  const termo = busca.trim().toLowerCase()
  const visiveis = PRODUTOS.filter(
    (p) =>
      p.ativo &&
      (!filtroCategoria || p.categoria === filtroCategoria) &&
      (!termo || p.nome.toLowerCase().includes(termo) || p.descricao.toLowerCase().includes(termo)),
  )

  const opcoes = CATEGORIAS.map(
    (c) =>
      `<option value="${esc(c)}" ${c === filtroCategoria ? 'selected' : ''}>${esc(c)}</option>`,
  ).join('')

  const cards = visiveis
    .map(
      (p) => `
      <article class="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-[0_1px_2px_rgba(11,41,5,0.04)] transition-shadow duration-200 hover:shadow-[0_8px_24px_-12px_rgba(11,41,5,0.28)]">
        ${imagemDoProduto(p.nome, p.categoria)}
        <div class="flex flex-1 flex-col p-5">
          <p class="font-ui text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">${esc(p.categoria)}</p>
          <h2 class="font-display mt-1.5 font-semibold leading-snug">${esc(p.nome)}</h2>
          <p class="mt-1.5 line-clamp-2 text-sm text-muted-foreground">${esc(p.descricao)}</p>
          <div class="mt-auto flex items-end justify-between gap-3 pt-4">
            <p class="flex items-baseline gap-1.5 leading-tight">
              ${p.tipoValor === 'medio' ? '<span class="text-xs text-muted-foreground">a partir de</span>' : ''}
              <span class="text-lg font-semibold">${brl(p.valor)}</span>
            </p>
            ${
              p.estoque !== null && p.estoque !== undefined
                ? `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">${p.estoque} em estoque</span>`
                : ''
            }
          </div>
        </div>
      </article>`,
    )
    .join('')

  return `
    ${cabecalho('Catálogo', 'Escolha o presente e siga para a solicitação. Produtos desativados não aparecem aqui.', 'Presentes')}
    ${barraDeFiltros(`
      <input id="busca" value="${esc(busca)}" placeholder="Buscar por nome ou descrição"
        class="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm" />
      <select id="categoria" class="h-10 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">Todas as categorias</option>${opcoes}
      </select>
      <p class="ml-auto pr-1 text-sm text-muted-foreground">${visiveis.length} ${visiveis.length === 1 ? 'presente' : 'presentes'}</p>
    `)}
    ${
      visiveis.length === 0
        ? estadoVazio(
            'Nenhum presente encontrado',
            'Nenhum produto ativo bate com esses filtros. Tente outra busca ou limpe a categoria.',
          )
        : `<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${cards}</div>`
    }
    <p class="mt-6 text-xs text-muted-foreground">
      O produto desativado (“Caneca personalizada”) não aparece aqui, mas continua visível nas
      solicitações antigas — regra do modelo de dados.
    </p>`
}

function telaNova() {
  const etapas = [
    [
      'Cliente',
      'Busca por CPF. Se o CPF já existir, a tela oferece o cliente encontrado em vez de criar uma duplicata.',
    ],
    [
      'Itens',
      'Produto do catálogo ou presente específico, com descrição e o link onde comprar. O valor congela na criação.',
    ],
    [
      'Entrega',
      'O CEP preenche logradouro, bairro, cidade e UF. O endereço é gravado como cópia na solicitação.',
    ],
    [
      'Carta e motivo',
      'A mensagem que acompanha o presente e o motivo do envio, com descrição obrigatória quando for “outro”.',
    ],
    ['Revisão', 'Confere itens e valores, gera o código SOL-AAAA-NNNN e abre o histórico.'],
  ]

  const itens = etapas
    .map(
      ([nome, texto], i) => `
      <li class="relative flex gap-5 pb-8 last:pb-0">
        ${i < etapas.length - 1 ? '<span class="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px bg-border"></span>' : ''}
        <span class="font-ui relative grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">${i + 1}</span>
        <div class="pt-1.5">
          <p class="font-display font-semibold">${esc(nome)}</p>
          <p class="mt-1 max-w-prose text-sm text-muted-foreground">${esc(texto)}</p>
        </div>
      </li>`,
    )
    .join('')

  return `
    ${cabecalho('Como funciona o pedido', 'Cinco etapas, do cliente à revisão. Nada é enviado antes da última.', 'Nova solicitação')}
    <div class="rounded-lg border bg-card p-6 shadow-[0_1px_2px_rgba(11,41,5,0.04)] sm:p-8">
      <ol class="relative">${itens}</ol>
    </div>
    <div class="mt-6">
      ${emConstrucao('<p>O formulário está em construção no sistema real. As regras que ele aplica já existem e estão cobertas por testes: item é de catálogo <em>ou</em> específico com link, o valor congela na criação e o motivo “outro” exige descrição.</p>')}
    </div>`
}

function linhasDeSolicitacao(lista, comConsultor) {
  return lista
    .map(
      (s) => `
    <tr class="border-b last:border-0 hover:bg-muted/40">
      <td class="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums">
        <button data-detalhe="${esc(s.codigo)}" class="underline-offset-4 hover:text-primary-emphasis hover:underline">${esc(s.codigo)}</button>
      </td>
      <td class="whitespace-nowrap px-4 py-3.5 tabular-nums text-muted-foreground">${esc(s.data)}</td>
      ${comConsultor ? `<td class="px-4 py-3.5">${esc(s.consultor)}</td>` : ''}
      <td class="px-4 py-3.5">${esc(s.cliente)}</td>
      <td class="px-4 py-3.5 text-right tabular-nums">${s.itens.length}</td>
      <td class="whitespace-nowrap px-4 py-3.5 text-right font-medium tabular-nums">${brl(totalDaSolicitacao(s))}</td>
      <td class="px-4 py-3.5">${selo(s.status)}</td>
    </tr>`,
    )
    .join('')
}

function telaMinhas() {
  const minhas = SOLICITACOES.filter((s) => s.consultor === 'Carlos Consultor')
  const gasto = minhas
    .filter((s) => !['cancelado', 'devolvido'].includes(s.status))
    .reduce((acc, s) => acc + totalDaSolicitacao(s), 0)
  const limite = 5000
  const pct = Math.min(100, (gasto / limite) * 100)

  return `
    ${cabecalho('Solicitações', 'Os presentes que você pediu, com o status de cada envio.', 'Minhas solicitações')}
    <div class="mb-6 rounded-lg border bg-card p-5 shadow-sm">
      <p class="text-sm text-muted-foreground">Gasto no mês</p>
      <p class="mt-1 text-2xl font-semibold">${brl(gasto)}</p>
      <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div class="h-full bg-success" style="width:${pct}%"></div>
      </div>
      <p class="mt-2 text-sm text-muted-foreground">${brl(gasto)} de ${brl(limite)} — canceladas e devolvidas não entram na conta.</p>
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
      ${cartao('Valor somado', brl(total), 'Canceladas e devolvidas fora da conta.')}
      ${cartao('Precisando de atenção', String(SOLICITACOES.filter((s) => s.status === 'deu_problema').length), 'com status “deu problema”')}
    </div>
    <div class="overflow-hidden rounded-lg border bg-card shadow-[0_1px_2px_rgba(11,41,5,0.04)]">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Código</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Data</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Consultor</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Cliente</th>
            <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Itens</th><th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Valor</th>
            <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Status</th>
          </tr>
        </thead>
        <tbody>${linhasDeSolicitacao(SOLICITACOES, true)}</tbody>
      </table>
    </div>
    <p class="mt-4 text-xs text-muted-foreground">
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
      <td class="max-w-xs p-3">
        ${
          i.site
            ? `<a href="${esc(i.site)}" target="_blank" rel="noopener" class="block truncate underline underline-offset-2">${esc(i.site)}</a>`
            : '<span class="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">catálogo</span>'
        }
      </td>
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
    </tr>`,
  ).join('')

  return `
    ${cabecalho('Gerenciar catálogo', 'Cadastro, edição e ativação de produtos — feitos pela própria área.', 'Administração')}
    ${emConstrucao(
      'Cadastro e edição de produto com upload de foto estão em construção. Produto nunca é excluído: a ação é desativar, e o desativado some do catálogo do consultor mas permanece nas solicitações antigas.',
    )}
    <div class="mt-6 overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Produto</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Categoria</th>
          <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Valor</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Estoque</th>
          <th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Situação</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`
}

function telaUsuarios() {
  const linhas = CONSULTORES.map(
    (u) => `
    <tr class="border-b last:border-0">
      <td class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">${esc(u.nome)}</td>
      <td class="p-3"><span class="rounded-md bg-muted px-2 py-0.5 text-xs">${esc(u.perfil)}</span></td>
      <td class="whitespace-nowrap p-3 text-right">${u.limite ? brl(u.limite) : '—'}</td>
    </tr>`,
  ).join('')

  return `
    ${cabecalho('Usuários', 'Perfil e limite mensal são geridos aqui, dentro da ferramenta, sem passar por TI.', 'Administração')}
    ${emConstrucao(
      'Usuários não são criados aqui: entram sozinhos no primeiro login pelo SSO, com perfil consultor. Esta tela é onde o Admin promove e define limite, sem passar por TI.',
    )}
    <div class="mt-6 overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/40 text-left text-muted-foreground">
          <tr><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Nome</th><th class="font-ui h-11 px-4 text-xs font-semibold uppercase tracking-[0.08em]">Perfil</th>
          <th class="font-ui h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.08em]">Limite mensal</th></tr>
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
  produtos: telaProdutos,
  usuarios: telaUsuarios,
}

// --- montagem ---------------------------------------------------------------

function render() {
  const permitidas = PERMISSOES[perfil]
  if (!permitidas.includes(tela)) tela = permitidas[0]

  document.getElementById('abas').innerHTML = TELAS.filter((t) => permitidas.includes(t.id))
    .map(
      (t) => `
      <button data-tela="${t.id}"
        class="rounded-md px-2.5 py-1 text-sm transition-colors ${
          // A barra é sempre escura, então as cores aqui são literais: os
          // tokens de texto do tema claro sumiriam sobre o verde da marca.
          t.id === tela
            ? 'bg-white/15 font-medium text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }">${esc(t.rotulo)}</button>`,
    )
    .join('')

  document.getElementById('conteudo').innerHTML = RENDER[tela]()
}

document.addEventListener('click', (e) => {
  const aba = e.target.closest('[data-tela]')
  if (aba) {
    tela = aba.dataset.tela
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
  if (e.target.id === 'categoria') {
    filtroCategoria = e.target.value
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
