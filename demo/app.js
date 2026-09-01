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
  return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.classe}">${esc(s.rotulo)}</span>`
}

function cartao(titulo, valor, rodape) {
  return `
    <div class="rounded-lg border bg-card p-5 shadow-sm">
      <p class="text-sm text-muted-foreground">${esc(titulo)}</p>
      <p class="mt-1 text-2xl font-semibold">${esc(valor)}</p>
      ${rodape ? `<p class="mt-1 text-sm text-muted-foreground">${rodape}</p>` : ''}
    </div>`
}

function cabecalho(titulo, descricao) {
  return `
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">${esc(titulo)}</h1>
      ${descricao ? `<p class="mt-1 text-sm text-muted-foreground">${esc(descricao)}</p>` : ''}
    </div>`
}

function emConstrucao(texto) {
  return `<div class="rounded-lg border border-dashed border-input bg-card p-6 text-sm text-muted-foreground">${texto}</div>`
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
      <div class="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
        <div class="flex aspect-[4/3] items-center justify-center bg-muted text-xs text-muted-foreground">
          sem foto
        </div>
        <div class="flex flex-1 flex-col p-4">
          <span class="w-fit rounded-md border px-2 py-0.5 text-xs text-muted-foreground">${esc(p.categoria)}</span>
          <h3 class="mt-2 font-medium">${esc(p.nome)}</h3>
          <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">${esc(p.descricao)}</p>
          <div class="mt-auto pt-3">
            <p class="font-medium">${p.tipoValor === 'medio' ? 'a partir de ' : ''}${brl(p.valor)}</p>
            ${
              p.estoque !== null && p.estoque !== undefined
                ? `<p class="text-xs text-muted-foreground">${p.estoque} em estoque</p>`
                : ''
            }
          </div>
        </div>
      </div>`,
    )
    .join('')

  return `
    ${cabecalho('Catálogo', `${visiveis.length} ${visiveis.length === 1 ? 'presente disponível' : 'presentes disponíveis'}`)}
    <div class="mb-6 flex flex-wrap gap-2">
      <input id="busca" value="${esc(busca)}" placeholder="Buscar por nome ou descrição"
        class="h-9 w-64 rounded-md border border-input px-3 text-sm" />
      <select id="categoria" class="h-9 rounded-md border border-input bg-card px-3 text-sm">
        <option value="">Todas as categorias</option>${opcoes}
      </select>
    </div>
    ${
      visiveis.length === 0
        ? '<p class="text-sm text-muted-foreground">Nenhum presente encontrado com esses filtros.</p>'
        : `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${cards}</div>`
    }
    <p class="mt-6 text-xs text-muted-foreground">
      O produto desativado (“Caneca personalizada”) não aparece aqui, mas continua visível nas
      solicitações antigas — regra do modelo de dados.
    </p>`
}

function telaNova() {
  const etapas = [
    ['Cliente', 'Busca por CPF. CPF já cadastrado oferece o cliente existente em vez de duplicar.'],
    ['Itens', 'Produto do catálogo ou presente específico com descrição e link onde comprar.'],
    [
      'Entrega',
      'CEP preenche logradouro, bairro, cidade e UF pelo ViaCEP. O endereço é gravado como snapshot.',
    ],
    [
      'Carta e motivo',
      'Mensagem que acompanha o envio e o motivo, com descrição obrigatória quando for “outro”.',
    ],
    ['Revisão', 'Confere itens e valores, gera o código SOL-AAAA-NNNN e abre o histórico.'],
  ]

  return `
    ${cabecalho('Nova solicitação', 'Fluxo em cinco etapas.')}
    <ol class="space-y-3">
      ${etapas
        .map(
          ([nome, texto], i) => `
        <li class="flex gap-4 rounded-lg border bg-card p-4">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-primary-foreground rounded-full text-sm font-medium">${i + 1}</span>
          <div>
            <p class="font-medium">${esc(nome)}</p>
            <p class="mt-0.5 text-sm text-muted-foreground">${esc(texto)}</p>
          </div>
        </li>`,
        )
        .join('')}
    </ol>
    <div class="mt-6">${emConstrucao(
      'O formulário está em construção no sistema real. As regras que ele aplica já existem e estão cobertas por testes: item é de catálogo <em>ou</em> específico com link, valor congela no momento da criação, e o motivo “outro” exige descrição.',
    )}</div>`
}

function linhasDeSolicitacao(lista, comConsultor) {
  return lista
    .map(
      (s) => `
    <tr class="border-b last:border-0 hover:bg-muted/40">
      <td class="p-3 font-medium">
        <button data-detalhe="${esc(s.codigo)}" class="underline underline-offset-2">${esc(s.codigo)}</button>
      </td>
      <td class="whitespace-nowrap p-3">${esc(s.data)}</td>
      ${comConsultor ? `<td class="p-3">${esc(s.consultor)}</td>` : ''}
      <td class="p-3">${esc(s.cliente)}</td>
      <td class="p-3 text-right">${s.itens.length}</td>
      <td class="whitespace-nowrap p-3 text-right">${brl(totalDaSolicitacao(s))}</td>
      <td class="p-3">${selo(s.status)}</td>
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
    ${cabecalho('Minhas solicitações', 'Visão do consultor: só as próprias solicitações.')}
    <div class="mb-6 rounded-lg border bg-card p-5 shadow-sm">
      <p class="text-sm text-muted-foreground">Gasto no mês</p>
      <p class="mt-1 text-2xl font-semibold">${brl(gasto)}</p>
      <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div class="h-full bg-success" style="width:${pct}%"></div>
      </div>
      <p class="mt-2 text-sm text-muted-foreground">${brl(gasto)} de ${brl(limite)} — canceladas e devolvidas não entram na conta.</p>
    </div>
    <div class="overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b text-left text-muted-foreground">
          <tr>
            <th class="p-3 font-medium">Código</th><th class="p-3 font-medium">Data</th>
            <th class="p-3 font-medium">Cliente</th><th class="p-3 text-right font-medium">Itens</th>
            <th class="p-3 text-right font-medium">Valor</th><th class="p-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>${linhasDeSolicitacao(minhas, false)}</tbody>
      </table>
    </div>`
}

function telaGestao() {
  const total = SOLICITACOES.reduce((acc, s) => acc + totalDaSolicitacao(s), 0)

  return `
    ${cabecalho('Solicitações', `${SOLICITACOES.length} solicitações no filtro atual`)}
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
      ${cartao('Solicitações', String(SOLICITACOES.length))}
      ${cartao('Valor total', brl(total))}
      ${cartao('Precisando de atenção', String(SOLICITACOES.filter((s) => s.status === 'deu_problema').length), 'com status “deu problema”')}
    </div>
    <div class="overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b text-left text-muted-foreground">
          <tr>
            <th class="p-3 font-medium">Código</th><th class="p-3 font-medium">Data</th>
            <th class="p-3 font-medium">Consultor</th><th class="p-3 font-medium">Cliente</th>
            <th class="p-3 text-right font-medium">Itens</th><th class="p-3 text-right font-medium">Valor</th>
            <th class="p-3 font-medium">Status</th>
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
        <div class="overflow-hidden rounded-lg border bg-card">
          <div class="border-b p-4 font-medium">Itens</div>
          <table class="w-full text-sm">
            <thead class="border-b text-left text-muted-foreground">
              <tr><th class="p-3 font-medium">Item</th><th class="p-3 text-right font-medium">Qtd.</th>
              <th class="p-3 text-right font-medium">Unitário</th><th class="p-3 text-right font-medium">Subtotal</th></tr>
            </thead>
            <tbody>
              ${itens}
              <tr><td colspan="3" class="p-3 text-right font-medium">Total</td>
              <td class="p-3 text-right font-medium">${brl(totalDaSolicitacao(s))}</td></tr>
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
    ${cabecalho('Fila de compras', 'Itens das solicitações enviadas para compra — visão do Financeiro.')}
    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      ${cartao('Aguardando compra', String(naFila.filter((i) => i.status === 'aguardando_compra').length))}
      ${cartao('Itens na fila', String(naFila.length))}
      ${cartao('Valor total', brl(total))}
    </div>
    <div class="overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b text-left text-muted-foreground">
          <tr>
            <th class="p-3 font-medium">Data</th><th class="p-3 font-medium">Código</th>
            <th class="p-3 font-medium">Produto</th><th class="p-3 font-medium">Site</th>
            <th class="p-3 text-right font-medium">Qtd.</th><th class="p-3 text-right font-medium">Valor</th>
            <th class="p-3 font-medium">Status</th>
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
      <td class="p-3 font-medium">${esc(p.nome)}</td>
      <td class="p-3">${esc(p.categoria)}</td>
      <td class="whitespace-nowrap p-3 text-right">${p.tipoValor === 'medio' ? 'a partir de ' : ''}${brl(p.valor)}</td>
      <td class="p-3">${p.estoque ?? '—'}</td>
      <td class="p-3">
        <span class="rounded-md border px-2 py-0.5 text-xs">${p.ativo ? 'ativo' : 'desativado'}</span>
      </td>
    </tr>`,
  ).join('')

  return `
    ${cabecalho('Gerenciar catálogo', `${PRODUTOS.length} produtos · ${CATEGORIAS.length} categorias`)}
    ${emConstrucao(
      'Cadastro e edição de produto com upload de foto estão em construção. Produto nunca é excluído: a ação é desativar, e o desativado some do catálogo do consultor mas permanece nas solicitações antigas.',
    )}
    <div class="mt-6 overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b text-left text-muted-foreground">
          <tr><th class="p-3 font-medium">Produto</th><th class="p-3 font-medium">Categoria</th>
          <th class="p-3 text-right font-medium">Valor</th><th class="p-3 font-medium">Estoque</th>
          <th class="p-3 font-medium">Situação</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`
}

function telaUsuarios() {
  const linhas = CONSULTORES.map(
    (u) => `
    <tr class="border-b last:border-0">
      <td class="p-3 font-medium">${esc(u.nome)}</td>
      <td class="p-3"><span class="rounded-md bg-muted px-2 py-0.5 text-xs">${esc(u.perfil)}</span></td>
      <td class="whitespace-nowrap p-3 text-right">${u.limite ? brl(u.limite) : '—'}</td>
    </tr>`,
  ).join('')

  return `
    ${cabecalho('Usuários', 'Perfil e limite mensal.')}
    ${emConstrucao(
      'Usuários não são criados aqui: entram sozinhos no primeiro login pelo SSO, com perfil consultor. Esta tela é onde o Admin promove e define limite, sem passar por TI.',
    )}
    <div class="mt-6 overflow-hidden rounded-lg border bg-card">
      <table class="w-full text-sm">
        <thead class="border-b text-left text-muted-foreground">
          <tr><th class="p-3 font-medium">Nome</th><th class="p-3 font-medium">Perfil</th>
          <th class="p-3 text-right font-medium">Limite mensal</th></tr>
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
