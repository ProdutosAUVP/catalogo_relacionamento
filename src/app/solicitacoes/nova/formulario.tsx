'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MotivoEnvio } from '@prisma/client'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CategoriaBadge } from '@/components/categoria-badge'
import { LinkDoProduto } from '@/components/link-do-produto'
import { ProdutoImagem } from '@/components/produto-imagem'
import { formatarCpf } from '@/lib/cpf'
import { formatarCep } from '@/lib/cep'
import { ROTULO_MOTIVO } from '@/lib/validators/solicitacao'
import { acompanhamentosFaltando, mensagemDePendencia } from '@/lib/acompanhamentos'
import { cn } from '@/lib/utils'
import {
  buscarClientePorCpf,
  criarCliente,
  criarSolicitacao,
  type ClienteEncontrado,
} from '@/lib/actions/solicitacoes'

/**
 * Formulário de nova solicitação, em cinco etapas.
 *
 * A validação de verdade acontece no servidor, em `solicitacaoSchema`. As
 * checagens daqui existem só para não deixar a pessoa avançar para uma etapa
 * que depende da anterior, e para ela ver o erro sem ida e volta.
 *
 * O estado vive todo neste componente, e não na URL: um rascunho pela metade
 * não deveria ser compartilhável nem sobreviver a um refresh acidental sem
 * aviso. Sair da página perde o rascunho, e o navegador avisa.
 */

export type ProdutoDoCatalogo = {
  id: string
  nome: string
  descricao: string | null
  categoriaNome: string
  fotoUrl: string | null
  /** Nulo quando a área ainda não informou o preço. Nulo não é zero. */
  valor: number | null
  tipoValor: 'exato' | 'medio'
  origem: 'estoque_interno' | 'mediante_pedido'
  controlaEstoque: boolean
  estoque: number | null
  /** A loja onde o presente é comprado, quando o cadastro tem o link. */
  urlCompra: string | null
  /** O que este presente precisa levar junto para poder ir, como `vinho`. */
  exigeAcompanhamento: string | null
  /** O que este presente satisfaz quando entra junto de um kit. */
  serveComoAcompanhamento: string | null
}

type ItemEscolhido =
  | { tipo: 'catalogo'; produto: ProdutoDoCatalogo; quantidade: number }
  | { tipo: 'especifico'; descricao: string; url: string; valor: string; quantidade: number }

type Endereco = {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  destinatario: string
}

type Carta = {
  motivo: MotivoEnvio
  motivoOutro: string
  mensagem: string
  observacoes: string
}

const ETAPAS = ['Cliente', 'Itens', 'Entrega', 'Carta', 'Revisão'] as const
type Etapa = 0 | 1 | 2 | 3 | 4

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * Produto sem preço informado entra no total como zero, e o resumo diz isso.
 *
 * O alternativo seria impedir a escolha, o que travaria o consultor por um dado
 * que só a área preenche, e o brinde personalizado sem preço é justamente o
 * mais pedido.
 */
const valorOuZero = (v: number | null) => v ?? 0

export function FormularioDeSolicitacao({ produtos }: { produtos: ProdutoDoCatalogo[] }) {
  const router = useRouter()
  const [enviando, iniciarEnvio] = useTransition()

  const [etapa, setEtapa] = useState<Etapa>(0)
  // A mais longe que a pessoa já chegou. A trilha navega até ela.
  const [maiorEtapa, setMaiorEtapa] = useState<Etapa>(0)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  // --- cliente ---
  const [cpf, setCpf] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [cliente, setCliente] = useState<ClienteEncontrado | null>(null)
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', email: '' })
  const [cpfBuscado, setCpfBuscado] = useState<string | null>(null)

  // --- itens ---
  const [itens, setItens] = useState<ItemEscolhido[]>([])
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [especifico, setEspecifico] = useState({ descricao: '', url: '', valor: '', quantidade: 1 })
  // Rótulo que o atalho do aviso está pedindo, como `vinho`. Nulo é a grade inteira.
  const [filtroAcompanhamento, setFiltroAcompanhamento] = useState<string | null>(null)

  // --- entrega ---
  const [entrega, setEntrega] = useState<Endereco>({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    destinatario: '',
  })
  const [buscandoCep, setBuscandoCep] = useState(false)

  // --- carta ---
  const [carta, setCarta] = useState<Carta>({
    motivo: MotivoEnvio.aniversario,
    motivoOutro: '',
    mensagem: '',
    observacoes: '',
  })

  const total = itens.reduce((acc, i) => {
    const valor =
      i.tipo === 'catalogo' ? valorOuZero(i.produto.valor) : Number(i.valor.replace(',', '.')) || 0
    return acc + valor * i.quantidade
  }, 0)

  /**
   * Kit que embala bebida não sai sozinho.
   *
   * A regra mora em `src/lib/acompanhamentos.ts` e a mesma função roda de novo
   * em `criarSolicitacao`: aqui ela existe para a pessoa ver o que falta
   * enquanto escolhe, e não depois de preencher endereço e carta.
   */
  const pendencias = acompanhamentosFaltando(
    itens.map((i) =>
      i.tipo === 'catalogo'
        ? { produtoId: i.produto.id, produto: i.produto }
        : // Presente específico é texto livre: não dá para afirmar que
          // "uma garrafa de tinto" é o vinho que o kit pede.
          { produtoId: null, produto: null },
    ),
  )
  const bloqueio = mensagemDePendencia(pendencias)

  // O recorte vale enquanto a falta existe. Escolhido o vinho, a grade volta
  // inteira sozinha, sem um efeito para desfazer o que a própria conta já diz.
  const filtroAtivo =
    filtroAcompanhamento && pendencias.some((p) => p.exigencia === filtroAcompanhamento)
      ? filtroAcompanhamento
      : null

  // Quando o aviso de acompanhamento manda escolher um vinho, a grade encolhe
  // para o que serve de vinho. Vem antes de busca e categoria porque é o corte
  // mais forte: não adianta oferecer a categoria "acessórios" nesse momento.
  const elegiveis = filtroAtivo
    ? produtos.filter((p) => p.serveComoAcompanhamento === filtroAtivo)
    : produtos

  // Busca e categoria se compõem, como no catálogo: filtrar por bebida e
  // depois digitar "whisky" precisa restringir, não recomeçar.
  const termo = busca.trim().toLowerCase()
  const combinaBusca = (p: ProdutoDoCatalogo) =>
    !termo || `${p.nome} ${p.descricao ?? ''}`.toLowerCase().includes(termo)

  const visiveis = elegiveis.filter(
    (p) => (!categoria || p.categoriaNome === categoria) && combinaBusca(p),
  )

  // A contagem de cada pílula respeita a busca, e não a categoria escolhida:
  // é o que permite ver quantos "whisky" existem em cada categoria.
  const porBusca = elegiveis.filter(combinaBusca)
  const categorias = [...new Set(elegiveis.map((p) => p.categoriaNome))]
    .map((nome) => ({ nome, total: porBusca.filter((p) => p.categoriaNome === nome).length }))
    .filter((c) => c.total > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const quantidadeDe = (id: string) =>
    itens.reduce(
      (soma, i) => soma + (i.tipo === 'catalogo' && i.produto.id === id ? i.quantidade : 0),
      0,
    )

  async function procurarCpf() {
    setErro(null)
    setBuscando(true)
    try {
      const r = await buscarClientePorCpf(cpf)
      setCpfBuscado(cpf)
      if (!r.ok) return setErro(r.erro)
      setCliente(r.dados)
      if (!r.dados) setNovoCliente((n) => ({ ...n, nome: '' }))
    } finally {
      setBuscando(false)
    }
  }

  async function cadastrarCliente() {
    setErro(null)
    const r = await criarCliente({ ...novoCliente, cpf })
    if (!r.ok) return setErro(r.erro)

    setCliente({
      id: r.dados.id,
      nome: novoCliente.nome,
      cpf,
      telefone: novoCliente.telefone || null,
      email: novoCliente.email || null,
    })
  }

  async function procurarCep() {
    setErro(null)
    setBuscandoCep(true)
    try {
      const resposta = await fetch(`/api/cep/${entrega.cep.replace(/\D/g, '')}`)
      if (!resposta.ok) {
        // Falha de CEP não trava a solicitação: a pessoa preenche à mão.
        setErro('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      const dados = await resposta.json()
      setEntrega((e) => ({
        ...e,
        logradouro: dados.logradouro || e.logradouro,
        bairro: dados.bairro || e.bairro,
        cidade: dados.cidade || e.cidade,
        uf: dados.uf || e.uf,
      }))
    } catch {
      setErro('Não foi possível consultar o CEP agora.')
    } finally {
      setBuscandoCep(false)
    }
  }

  function adicionarDoCatalogo(produto: ProdutoDoCatalogo) {
    setItens((atuais) => {
      const existente = atuais.findIndex(
        (i) => i.tipo === 'catalogo' && i.produto.id === produto.id,
      )
      if (existente >= 0) {
        const copia = [...atuais]
        const item = copia[existente]!
        copia[existente] = { ...item, quantidade: item.quantidade + 1 }
        return copia
      }
      return [...atuais, { tipo: 'catalogo', produto, quantidade: 1 }]
    })
  }

  function adicionarEspecifico() {
    setErro(null)
    if (!especifico.descricao.trim()) return setErro('Descreva o presente específico.')
    if (!especifico.url.trim()) return setErro('Informe o link onde comprar.')
    if (!especifico.valor.trim()) return setErro('Informe o valor do presente específico.')

    setItens((a) => [
      ...a,
      {
        tipo: 'especifico',
        descricao: especifico.descricao,
        url: especifico.url,
        valor: especifico.valor,
        quantidade: especifico.quantidade,
      },
    ])
    setEspecifico({ descricao: '', url: '', valor: '', quantidade: 1 })
  }

  function enviar() {
    setErro(null)
    iniciarEnvio(async () => {
      const r = await criarSolicitacao({
        clienteId: cliente?.id,
        motivo: carta.motivo,
        motivoOutro: carta.motivoOutro,
        mensagemCarta: carta.mensagem,
        observacoes: carta.observacoes,
        entregaCep: entrega.cep,
        entregaLogradouro: entrega.logradouro,
        entregaNumero: entrega.numero,
        entregaComplemento: entrega.complemento,
        entregaBairro: entrega.bairro,
        entregaCidade: entrega.cidade,
        entregaUf: entrega.uf,
        entregaDestinatario: entrega.destinatario,
        itens: itens.map((i) =>
          i.tipo === 'catalogo'
            ? // O valor que vale é o relido do banco em `criarSolicitacao`;
              // este vai junto só para o schema aceitar a forma do item.
              {
                produtoId: i.produto.id,
                valorUnitario: valorOuZero(i.produto.valor),
                quantidade: i.quantidade,
              }
            : {
                descricaoLivre: i.descricao,
                urlExterna: i.url,
                valorUnitario: i.valor,
                quantidade: i.quantidade,
              },
        ),
      })

      if (!r.ok) return setErro(r.erro)

      // Vai para a solicitação criada, e não para a lista: quem acabou de
      // pedir quer ver o código e conferir o que foi gravado. Da lista, a
      // pessoa teria de procurar o próprio pedido entre os outros.
      setEnviado(true)
      router.push(`/solicitacoes/${r.dados.id}`)
      router.refresh()
    })
  }

  /** Muda de etapa e sobe a página: a trilha some do campo de visão em telas baixas. */
  function irPara(proxima: Etapa) {
    setEtapa(proxima)
    setMaiorEtapa((maior) => (proxima > maior ? proxima : maior))
    setErro(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Atalho do aviso: volta para os itens já filtrado no que resolve a falta. */
  function escolherAcompanhamento(rotulo: string) {
    setBusca('')
    setCategoria('')
    setFiltroAcompanhamento(rotulo)
    irPara(1)
  }

  /**
   * Aviso do navegador ao sair com rascunho pela metade.
   *
   * O rascunho vive só na memória desta tela: fechar a aba perde o que foi
   * digitado, e uma solicitação tem cliente, itens, endereço e carta. O aviso
   * nativo é o único que funciona em fechar aba, voltar e recarregar ao mesmo
   * tempo.
   *
   * Some depois do envio, senão a própria navegação para a solicitação criada
   * dispararia o aviso.
   */
  const temRascunho = Boolean(cliente || itens.length > 0 || carta.mensagem.trim())
  useEffect(() => {
    if (!temRascunho || enviado) return

    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [temRascunho, enviado])

  const podeAvancar =
    (etapa === 0 && Boolean(cliente)) ||
    (etapa === 1 && itens.length > 0 && !bloqueio) ||
    (etapa === 2 &&
      Boolean(
        entrega.cep &&
        entrega.logradouro &&
        entrega.numero &&
        entrega.bairro &&
        entrega.cidade &&
        entrega.uf &&
        entrega.destinatario,
      )) ||
    (etapa === 3 &&
      Boolean(carta.mensagem.trim()) &&
      (carta.motivo !== MotivoEnvio.outro || Boolean(carta.motivoOutro.trim())))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        <Trilha
          etapa={etapa}
          maiorEtapa={maiorEtapa}
          aoIr={(i) => i <= maiorEtapa && irPara(i as Etapa)}
        />

        {erro ? (
          <p
            role="alert"
            className="border-error/30 bg-error/10 text-error mb-4 rounded-lg border px-4 py-3 text-sm"
          >
            {erro}
          </p>
        ) : null}

        {/* Fica fora da etapa de itens de propósito: tirar o vinho depois de
            preencher o endereço também trava, e o aviso precisa aparecer onde
            a pessoa estiver. */}
        {bloqueio ? (
          <div
            role="alert"
            className="border-warning/40 bg-warning/10 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3"
          >
            <p className="min-w-0 flex-1 text-sm">{bloqueio}</p>
            {pendencias.map((p) => (
              <Button
                key={p.exigencia}
                size="sm"
                variant="outline"
                onClick={() => escolherAcompanhamento(p.exigencia)}
              >
                Escolher o {p.exigencia}
              </Button>
            ))}
          </div>
        ) : null}

        <Card>
          <CardContent className="p-6">
            {etapa === 0 ? (
              <EtapaCliente
                cpf={cpf}
                setCpf={(v) => {
                  setCpf(v)
                  setCliente(null)
                  setCpfBuscado(null)
                }}
                buscando={buscando}
                procurar={procurarCpf}
                cliente={cliente}
                cpfBuscado={cpfBuscado}
                novo={novoCliente}
                setNovo={setNovoCliente}
                cadastrar={cadastrarCliente}
                limpar={() => {
                  setCliente(null)
                  setCpfBuscado(null)
                }}
              />
            ) : null}

            {etapa === 1 ? (
              <EtapaItens
                produtos={visiveis}
                categorias={categorias}
                busca={busca}
                setBusca={setBusca}
                categoria={categoria}
                setCategoria={setCategoria}
                quantidadeDe={quantidadeDe}
                adicionar={adicionarDoCatalogo}
                filtroAcompanhamento={filtroAtivo}
                limparAcompanhamento={() => setFiltroAcompanhamento(null)}
                especifico={especifico}
                setEspecifico={setEspecifico}
                adicionarEspecifico={adicionarEspecifico}
              />
            ) : null}

            {etapa === 2 ? (
              <EtapaEntrega
                entrega={entrega}
                setEntrega={setEntrega}
                buscando={buscandoCep}
                procurar={procurarCep}
                sugestao={cliente?.nome ?? ''}
              />
            ) : null}

            {etapa === 3 ? <EtapaCarta carta={carta} setCarta={setCarta} /> : null}

            {etapa === 4 ? (
              <EtapaRevisao
                cliente={cliente}
                itens={itens}
                entrega={entrega}
                carta={carta}
                total={total}
              />
            ) : null}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => irPara(Math.max(0, etapa - 1) as Etapa)}
            disabled={etapa === 0 || enviando}
          >
            Voltar
          </Button>

          {etapa < 4 ? (
            <Button onClick={() => irPara((etapa + 1) as Etapa)} disabled={!podeAvancar}>
              Continuar
            </Button>
          ) : (
            <Button onClick={enviar} disabled={enviando || Boolean(bloqueio)}>
              {enviando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {enviando ? 'Enviando…' : 'Enviar solicitação'}
            </Button>
          )}
        </div>
      </div>

      <Resumo
        cliente={cliente}
        itens={itens}
        total={total}
        remover={(i) => setItens((a) => a.filter((_, indice) => indice !== i))}
        mudarQuantidade={(i, q) =>
          setItens((a) =>
            a.map((item, indice) =>
              indice === i ? { ...item, quantidade: Math.max(1, q) } : item,
            ),
          )
        }
      />
    </div>
  )
}

/**
 * Trilha das etapas, que também navega.
 *
 * `maiorEtapa` é a mais longe que a pessoa já chegou, e não a atual: voltar
 * para conferir o cliente e depois pular direto para a revisão é o movimento
 * natural de quem revisa. Antes disso a trilha só voltava, e o caminho de
 * volta era clicar "Continuar" três vezes.
 *
 * O que não muda é a ordem de destravar: só se chega à etapa 4 tendo passado
 * pelas outras, porque `podeAvancar` continua mandando na primeira visita.
 */
function Trilha({
  etapa,
  maiorEtapa,
  aoIr,
}: {
  etapa: Etapa
  maiorEtapa: Etapa
  aoIr: (i: number) => void
}) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-2">
      {ETAPAS.map((nome, i) => {
        const concluida = i < maiorEtapa
        const atual = i === etapa
        const alcancavel = i <= maiorEtapa

        return (
          <li key={nome} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => aoIr(i)}
              disabled={!alcancavel || atual}
              aria-current={atual ? 'step' : undefined}
              className={cn(
                'ease-apple flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-200',
                atual && 'bg-primary/10 text-primary-emphasis font-medium',
                !atual &&
                  alcancavel &&
                  'text-muted-foreground hover:bg-muted hover:text-foreground',
                !alcancavel && 'text-muted-foreground/60',
              )}
            >
              <span
                className={cn(
                  'font-ui grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold',
                  atual && 'bg-primary text-primary-foreground',
                  concluida && 'bg-success text-success-foreground',
                  !atual && !concluida && 'bg-muted text-muted-foreground',
                )}
              >
                {concluida && !atual ? <Check className="size-3" aria-hidden="true" /> : i + 1}
              </span>
              {nome}
            </button>
            {i < ETAPAS.length - 1 ? (
              <span className="bg-border h-px w-4 shrink-0" aria-hidden="true" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function EtapaCliente({
  cpf,
  setCpf,
  buscando,
  procurar,
  cliente,
  cpfBuscado,
  novo,
  setNovo,
  cadastrar,
  limpar,
}: {
  cpf: string
  setCpf: (v: string) => void
  buscando: boolean
  procurar: () => void
  cliente: ClienteEncontrado | null
  cpfBuscado: string | null
  novo: { nome: string; telefone: string; email: string }
  setNovo: (v: { nome: string; telefone: string; email: string }) => void
  cadastrar: () => void
  limpar: () => void
}) {
  // Buscou, não achou e ainda não cadastrou: é a hora de oferecer o cadastro.
  const cadastrando = cpfBuscado !== null && !cliente

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Para quem é o presente?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          O CPF identifica o cliente. Se já existir, usamos o cadastro que está lá.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor="cpf">CPF do cliente</Label>
          <Input
            id="cpf"
            value={cpf}
            inputMode="numeric"
            placeholder="000.000.000-00"
            onChange={(e) => setCpf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                procurar()
              }
            }}
          />
        </div>
        <Button onClick={procurar} disabled={buscando || cpf.replace(/\D/g, '').length !== 11}>
          {buscando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Buscar
        </Button>
      </div>

      {cliente ? (
        <div className="border-success/30 bg-success/10 rounded-lg border p-4">
          <p className="font-ui text-success text-xs font-semibold tracking-wider uppercase">
            Cliente encontrado
          </p>
          <p className="mt-1.5 font-medium">{cliente.nome}</p>
          <p className="text-muted-foreground text-sm tabular-nums">{formatarCpf(cliente.cpf)}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={limpar}>
            Trocar de cliente
          </Button>
        </div>
      ) : null}

      {cadastrando ? (
        <div className="space-y-4 rounded-lg border border-dashed p-4">
          <p className="text-sm">Nenhum cliente com esse CPF. Preencha os dados para cadastrar.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={novo.telefone}
                inputMode="numeric"
                placeholder="(11) 90000-0000"
                onChange={(e) => setNovo({ ...novo, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={novo.email}
                onChange={(e) => setNovo({ ...novo, email: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={cadastrar} disabled={novo.nome.trim().length < 2}>
            Cadastrar cliente
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Escolha dos itens.
 *
 * O catálogo tem quase cinquenta presentes, então a etapa é uma tela de
 * escolha de verdade: busca, filtro por categoria e a grade inteira na página.
 * A versão anterior punha tudo numa caixa de rolagem de três cards, o que
 * obrigava a rolar dentro de uma caixa dentro da página para conhecer o que
 * existe.
 *
 * Cada card diz o que o consultor precisa para decidir: a foto, o preço, se
 * sai da prateleira ou espera compra, e o link da loja para ver medida e sabor
 * antes de escolher.
 */
function EtapaItens({
  produtos,
  categorias,
  busca,
  setBusca,
  categoria,
  setCategoria,
  quantidadeDe,
  adicionar,
  filtroAcompanhamento,
  limparAcompanhamento,
  especifico,
  setEspecifico,
  adicionarEspecifico,
}: {
  produtos: ProdutoDoCatalogo[]
  categorias: { nome: string; total: number }[]
  busca: string
  setBusca: (v: string) => void
  categoria: string
  setCategoria: (v: string) => void
  /** Quantas unidades deste produto já estão na solicitação. */
  quantidadeDe: (id: string) => number
  adicionar: (p: ProdutoDoCatalogo) => void
  /** Rótulo pedido pelo aviso, quando a grade está recortada nele. */
  filtroAcompanhamento: string | null
  limparAcompanhamento: () => void
  especifico: { descricao: string; url: string; valor: string; quantidade: number }
  setEspecifico: (v: { descricao: string; url: string; valor: string; quantidade: number }) => void
  adicionarEspecifico: () => void
}) {
  const filtrando = Boolean(busca.trim() || categoria)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">O que vai no envio?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Escolha do catálogo ou descreva um presente específico com o link onde comprar.
        </p>
      </div>

      {/* O recorte é forte o bastante para esconder o catálogo inteiro, então
          ele se anuncia, e sai com um clique. */}
      {filtroAcompanhamento ? (
        <div className="bg-muted/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2">
          <p className="min-w-0 flex-1 text-sm">
            Mostrando só o que serve como <strong>{filtroAcompanhamento}</strong>.
          </p>
          <Button variant="ghost" size="sm" onClick={limparAcompanhamento}>
            Ver o catálogo inteiro
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar no catálogo"
          aria-label="Buscar no catálogo"
        />

        {/* As mesmas pílulas do catálogo: com quase cinquenta presentes, a
            categoria é o primeiro corte que a pessoa faz. */}
        <div
          role="group"
          aria-label="Filtrar por categoria"
          className="-mx-1 flex flex-wrap gap-2 px-1"
        >
          <PilulaDeCategoria
            rotulo="Todos"
            total={produtos.length}
            ativa={!categoria}
            aoClicar={() => setCategoria('')}
          />
          {categorias.map((c) => (
            <PilulaDeCategoria
              key={c.nome}
              rotulo={c.nome}
              total={c.total}
              ativa={categoria === c.nome}
              aoClicar={() => setCategoria(categoria === c.nome ? '' : c.nome)}
            />
          ))}
        </div>
      </div>

      {produtos.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <p className="text-sm font-medium">Nenhum presente com esse filtro</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tente outra busca, ou descreva um presente específico aqui embaixo.
          </p>
          {filtrando ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setBusca('')
                setCategoria('')
              }}
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((p) => (
            <CardDeProduto
              key={p.id}
              produto={p}
              quantidade={quantidadeDe(p.id)}
              adicionar={() => adicionar(p)}
            />
          ))}
        </div>
      )}

      <div className="space-y-4 rounded-lg border border-dashed p-4">
        <p className="font-display font-semibold">Presente específico</p>
        <p className="text-muted-foreground -mt-3 text-sm">
          Fora do catálogo. O link é obrigatório: é por ele que o Financeiro compra.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="desc-livre">O que é</Label>
            <Input
              id="desc-livre"
              value={especifico.descricao}
              onChange={(e) => setEspecifico({ ...especifico, descricao: e.target.value })}
              placeholder="Ex.: enxoval de berço bordado"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="url-livre">Link onde comprar</Label>
            <Input
              id="url-livre"
              type="url"
              value={especifico.url}
              onChange={(e) => setEspecifico({ ...especifico, url: e.target.value })}
              placeholder="https://"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor-livre">Valor unitário</Label>
            <Input
              id="valor-livre"
              value={especifico.valor}
              inputMode="decimal"
              onChange={(e) => setEspecifico({ ...especifico, valor: e.target.value })}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qtd-livre">Quantidade</Label>
            <Input
              id="qtd-livre"
              type="number"
              min={1}
              value={especifico.quantidade}
              onChange={(e) =>
                setEspecifico({ ...especifico, quantidade: Number(e.target.value) || 1 })
              }
            />
          </div>
        </div>
        <Button variant="outline" onClick={adicionarEspecifico}>
          <Plus aria-hidden="true" />
          Adicionar item específico
        </Button>
      </div>
    </div>
  )
}

function EtapaEntrega({
  entrega,
  setEntrega,
  buscando,
  procurar,
  sugestao,
}: {
  entrega: Endereco
  setEntrega: React.Dispatch<React.SetStateAction<Endereco>>
  buscando: boolean
  procurar: () => void
  sugestao: string
}) {
  const campo = (k: keyof Endereco) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEntrega((atual) => ({ ...atual, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Para onde enviar?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          O endereço fica gravado nesta solicitação. Se o cliente se mudar, o histórico continua
          mostrando para onde o presente foi.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-6">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cep">CEP</Label>
          <div className="flex gap-2">
            <Input
              id="cep"
              value={entrega.cep}
              inputMode="numeric"
              placeholder="00000-000"
              onChange={campo('cep')}
              onBlur={() => entrega.cep.replace(/\D/g, '').length === 8 && procurar()}
            />
            <Button variant="outline" onClick={procurar} disabled={buscando}>
              {buscando ? <Loader2 className="animate-spin" aria-hidden="true" /> : 'Buscar'}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-4">
          <Label htmlFor="logradouro">Logradouro</Label>
          <Input id="logradouro" value={entrega.logradouro} onChange={campo('logradouro')} />
        </div>

        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="numero">Número</Label>
          <Input id="numero" value={entrega.numero} onChange={campo('numero')} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input id="complemento" value={entrega.complemento} onChange={campo('complemento')} />
        </div>

        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" value={entrega.bairro} onChange={campo('bairro')} />
        </div>

        <div className="space-y-1.5 sm:col-span-4">
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" value={entrega.cidade} onChange={campo('cidade')} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="uf">UF</Label>
          <Input id="uf" maxLength={2} value={entrega.uf} onChange={campo('uf')} />
        </div>

        <div className="space-y-1.5 sm:col-span-6">
          <Label htmlFor="destinatario">Quem recebe</Label>
          <Input
            id="destinatario"
            value={entrega.destinatario}
            onChange={campo('destinatario')}
            placeholder={sugestao}
          />
          {sugestao && !entrega.destinatario ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEntrega((a) => ({ ...a, destinatario: sugestao }))}
            >
              Usar “{sugestao}”
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function EtapaCarta({
  carta,
  setCarta,
}: {
  carta: Carta
  setCarta: React.Dispatch<React.SetStateAction<Carta>>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold">A carta que vai junto</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          A mensagem acompanha o presente. A impressão continua sendo feita fora do sistema.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="motivo">Motivo do envio</Label>
          <Select
            id="motivo"
            value={carta.motivo}
            onChange={(e) => setCarta({ ...carta, motivo: e.target.value as MotivoEnvio })}
          >
            {Object.entries(ROTULO_MOTIVO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Select>
        </div>

        {carta.motivo === MotivoEnvio.outro ? (
          <div className="space-y-1.5">
            <Label htmlFor="motivo-outro">Qual?</Label>
            <Input
              id="motivo-outro"
              value={carta.motivoOutro}
              onChange={(e) => setCarta({ ...carta, motivoOutro: e.target.value })}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mensagem">Mensagem</Label>
        <Textarea
          id="mensagem"
          rows={5}
          value={carta.mensagem}
          onChange={(e) => setCarta({ ...carta, mensagem: e.target.value })}
          placeholder="Escreva a mensagem que vai na carta."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="obs">Observações internas</Label>
        <Textarea
          id="obs"
          rows={2}
          value={carta.observacoes}
          onChange={(e) => setCarta({ ...carta, observacoes: e.target.value })}
          placeholder="Não vai na carta. Fica para quem processa o envio."
        />
      </div>
    </div>
  )
}

function EtapaRevisao({
  cliente,
  itens,
  entrega,
  carta,
  total,
}: {
  cliente: ClienteEncontrado | null
  itens: ItemEscolhido[]
  entrega: Endereco
  carta: Carta
  total: number
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Confira antes de enviar</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Nada foi criado ainda. A solicitação nasce ao enviar, com o código e o histórico.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Bloco titulo="Cliente">
          <p className="font-medium">{cliente?.nome}</p>
          <p className="text-muted-foreground tabular-nums">
            {cliente ? formatarCpf(cliente.cpf) : null}
          </p>
        </Bloco>

        <Bloco titulo="Entrega">
          <p className="font-medium">{entrega.destinatario}</p>
          <p className="text-muted-foreground">
            {entrega.logradouro}, {entrega.numero}
            {entrega.complemento ? `, ${entrega.complemento}` : ''}
          </p>
          <p className="text-muted-foreground">
            {entrega.bairro} · {entrega.cidade}/{entrega.uf.toUpperCase()} ·{' '}
            <span className="tabular-nums">{formatarCep(entrega.cep)}</span>
          </p>
        </Bloco>

        <Bloco titulo="Motivo">
          <p>
            {carta.motivo === MotivoEnvio.outro ? carta.motivoOutro : ROTULO_MOTIVO[carta.motivo]}
          </p>
        </Bloco>

        <Bloco titulo="Total">
          <p className="text-lg font-semibold">{brl(total)}</p>
          <p className="text-muted-foreground">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </p>
        </Bloco>
      </dl>

      <div>
        <p className="font-ui text-muted-foreground mb-2 text-xs font-semibold tracking-[0.1em] uppercase">
          Carta
        </p>
        <blockquote className="border-primary/25 bg-muted/40 rounded-r-md border-l-2 py-3 pr-4 pl-4 text-sm leading-relaxed whitespace-pre-wrap">
          {carta.mensagem}
        </blockquote>
      </div>
    </div>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 rounded-lg p-4 text-sm">
      <dt className="font-ui text-muted-foreground mb-1.5 text-xs font-semibold tracking-[0.1em] uppercase">
        {titulo}
      </dt>
      <dd className="space-y-0.5">{children}</dd>
    </div>
  )
}

/** Coluna lateral com o que já foi escolhido, visível em todas as etapas. */
function Resumo({
  cliente,
  itens,
  total,
  remover,
  mudarQuantidade,
}: {
  cliente: ClienteEncontrado | null
  itens: ItemEscolhido[]
  total: number
  remover: (i: number) => void
  mudarQuantidade: (i: number, q: number) => void
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="font-ui text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            Resumo
          </p>

          {cliente ? (
            <div className="text-sm">
              <p className="font-medium">{cliente.nome}</p>
              <p className="text-muted-foreground tabular-nums">{formatarCpf(cliente.cpf)}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum cliente escolhido ainda.</p>
          )}

          <div className="space-y-3 border-t pt-4">
            {itens.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum item adicionado.</p>
            ) : (
              itens.map((item, i) => {
                const nome = item.tipo === 'catalogo' ? item.produto.nome : item.descricao
                const semPreco = item.tipo === 'catalogo' && item.produto.valor === null
                const valor =
                  item.tipo === 'catalogo'
                    ? valorOuZero(item.produto.valor)
                    : Number(item.valor.replace(',', '.')) || 0

                return (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="leading-snug font-medium">{nome}</p>
                      <p className="text-muted-foreground tabular-nums">
                        {item.quantidade} × {semPreco ? 'valor a definir' : brl(valor)}
                      </p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={item.quantidade}
                      aria-label={`Quantidade de ${nome}`}
                      onChange={(e) => mudarQuantidade(i, Number(e.target.value))}
                      className="border-input h-8 w-14 rounded-md border px-2 text-sm tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => remover(i)}
                      aria-label={`Remover ${nome}`}
                      className="text-muted-foreground hover:text-error mt-1 transition-colors"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-baseline justify-between border-t pt-4">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className="font-body text-xl font-semibold">{brl(total)}</span>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

/** Pílula de categoria, no padrão do catálogo. */
function PilulaDeCategoria({
  rotulo,
  total,
  ativa,
  aoClicar,
}: {
  rotulo: string
  total: number
  ativa: boolean
  aoClicar: () => void
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativa}
      className={cn(
        'ease-apple rounded-xl border px-3 py-1.5 text-left transition-[border-color,background-color,box-shadow] duration-200',
        ativa
          ? 'border-primary bg-primary/5 ring-primary/25 ring-2'
          : 'hover:border-primary/40 hover:shadow-sm',
      )}
    >
      <span className="font-display block text-xs leading-tight font-bold whitespace-nowrap">
        {rotulo}
      </span>
      <span className="font-roboto text-muted-foreground mt-0.5 block text-[10px] leading-tight">
        {total} {total === 1 ? 'item' : 'itens'}
      </span>
    </button>
  )
}

/**
 * Card de produto na escolha.
 *
 * O card inteiro adiciona, e o link da loja abre numa aba nova sem adicionar
 * nada. Por isso o card é uma `div` com um botão que a cobre, e não um
 * `<button>` com o link dentro: âncora dentro de botão é HTML inválido, e o
 * navegador desmonta a estrutura de um jeito que ninguém consegue prever.
 */
function CardDeProduto({
  produto,
  quantidade,
  adicionar,
}: {
  produto: ProdutoDoCatalogo
  quantidade: number
  adicionar: () => void
}) {
  const semEstoque = produto.controlaEstoque && !produto.estoque

  return (
    <div
      className={cn(
        'group bg-card ease-apple relative flex flex-col overflow-hidden rounded-xl border transition-[border-color,box-shadow] duration-200',
        quantidade > 0 ? 'border-primary ring-primary/20 ring-2' : 'hover:border-primary/40',
      )}
    >
      <ProdutoImagem
        fotoUrl={produto.fotoUrl}
        nome={produto.nome}
        categoria={produto.categoriaNome}
      />

      {quantidade > 0 ? (
        <span className="bg-primary text-primary-foreground font-ui absolute top-2 right-2 z-20 grid size-7 place-items-center rounded-full text-xs font-bold tabular-nums">
          {quantidade}
        </span>
      ) : null}

      <div className="flex flex-1 flex-col items-start gap-1.5 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoriaBadge categoria={produto.categoriaNome} />
          {/* Dito antes de escolher, e não só no aviso que trava depois. */}
          {produto.exigeAcompanhamento ? (
            <Badge variant="outline">vai com {produto.exigeAcompanhamento}</Badge>
          ) : null}
        </div>
        <p className="font-display text-sm leading-snug font-semibold text-balance">
          {produto.nome}
        </p>

        <LinkDoProduto url={produto.urlCompra} className="relative z-20" />

        <div className="mt-auto flex w-full items-end justify-between gap-2 pt-2">
          <span className="text-sm font-medium">
            {produto.valor === null ? (
              <span className="text-muted-foreground font-normal">valor a definir</span>
            ) : (
              <>
                {produto.tipoValor === 'medio' ? (
                  <span className="text-muted-foreground text-xs">a partir de </span>
                ) : null}
                {brl(produto.valor)}
              </>
            )}
          </span>

          {semEstoque ? (
            <Badge variant="muted">sem estoque</Badge>
          ) : produto.origem === 'estoque_interno' ? (
            <Badge variant="outline">pronta entrega</Badge>
          ) : (
            <Badge variant="muted">sob encomenda</Badge>
          )}
        </div>
      </div>

      {/* Cobre o card sem envolver o link, que tem z-index maior. */}
      <button
        type="button"
        onClick={adicionar}
        aria-label={
          quantidade > 0 ? `Adicionar outro ${produto.nome}` : `Adicionar ${produto.nome}`
        }
        className="focus-visible:ring-primary absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:outline-none"
      />
    </div>
  )
}
