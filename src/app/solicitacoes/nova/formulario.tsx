'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MotivoEnvio } from '@prisma/client'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CategoriaBadge } from '@/components/categoria-badge'
import { ProdutoImagem } from '@/components/produto-imagem'
import { formatarCpf } from '@/lib/cpf'
import { formatarCep } from '@/lib/cep'
import { ROTULO_MOTIVO } from '@/lib/validators/solicitacao'
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
 * que depende da anterior — e para ela ver o erro sem ida e volta.
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
  controlaEstoque: boolean
  estoque: number | null
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
 * que só a área preenche — e o brinde personalizado sem preço é justamente o
 * mais pedido.
 */
const valorOuZero = (v: number | null) => v ?? 0

export function FormularioDeSolicitacao({ produtos }: { produtos: ProdutoDoCatalogo[] }) {
  const router = useRouter()
  const [enviando, iniciarEnvio] = useTransition()

  const [etapa, setEtapa] = useState<Etapa>(0)
  const [erro, setErro] = useState<string | null>(null)

  // --- cliente ---
  const [cpf, setCpf] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [cliente, setCliente] = useState<ClienteEncontrado | null>(null)
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', email: '' })
  const [cpfBuscado, setCpfBuscado] = useState<string | null>(null)

  // --- itens ---
  const [itens, setItens] = useState<ItemEscolhido[]>([])
  const [busca, setBusca] = useState('')
  const [especifico, setEspecifico] = useState({ descricao: '', url: '', valor: '', quantidade: 1 })

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

  const visiveis = busca.trim()
    ? produtos.filter((p) =>
        `${p.nome} ${p.descricao ?? ''}`.toLowerCase().includes(busca.trim().toLowerCase()),
      )
    : produtos

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
      router.push('/solicitacoes')
      router.refresh()
    })
  }

  const podeAvancar =
    (etapa === 0 && Boolean(cliente)) ||
    (etapa === 1 && itens.length > 0) ||
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
        <Trilha etapa={etapa} aoIr={(i) => i < etapa && setEtapa(i as Etapa)} />

        {erro ? (
          <p
            role="alert"
            className="border-error/30 bg-error/10 text-error mb-4 rounded-lg border px-4 py-3 text-sm"
          >
            {erro}
          </p>
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
                busca={busca}
                setBusca={setBusca}
                adicionar={adicionarDoCatalogo}
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
            onClick={() => setEtapa((e) => Math.max(0, e - 1) as Etapa)}
            disabled={etapa === 0 || enviando}
          >
            Voltar
          </Button>

          {etapa < 4 ? (
            <Button onClick={() => setEtapa((e) => (e + 1) as Etapa)} disabled={!podeAvancar}>
              Continuar
            </Button>
          ) : (
            <Button onClick={enviar} disabled={enviando}>
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

/** Trilha das etapas. Também é o indicador de progresso. */
function Trilha({ etapa, aoIr }: { etapa: Etapa; aoIr: (i: number) => void }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-2">
      {ETAPAS.map((nome, i) => {
        const concluida = i < etapa
        const atual = i === etapa

        return (
          <li key={nome} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => aoIr(i)}
              disabled={!concluida}
              aria-current={atual ? 'step' : undefined}
              className={cn(
                'ease-apple flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-200',
                atual && 'bg-primary/10 text-primary-emphasis font-medium',
                concluida && 'text-muted-foreground hover:bg-muted hover:text-foreground',
                !atual && !concluida && 'text-muted-foreground/60',
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
                {concluida ? <Check className="size-3" aria-hidden="true" /> : i + 1}
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

function EtapaItens({
  produtos,
  busca,
  setBusca,
  adicionar,
  especifico,
  setEspecifico,
  adicionarEspecifico,
}: {
  produtos: ProdutoDoCatalogo[]
  busca: string
  setBusca: (v: string) => void
  adicionar: (p: ProdutoDoCatalogo) => void
  especifico: { descricao: string; url: string; valor: string; quantidade: number }
  setEspecifico: (v: { descricao: string; url: string; valor: string; quantidade: number }) => void
  adicionarEspecifico: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">O que vai no envio?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Escolha do catálogo ou descreva um presente específico com o link onde comprar.
        </p>
      </div>

      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar no catálogo"
        aria-label="Buscar no catálogo"
      />

      <div className="grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {produtos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => adicionar(p)}
            className="group hover:border-primary/40 ease-apple flex flex-col overflow-hidden rounded-xl border text-left transition-[border-color,box-shadow] duration-200 hover:shadow-sm"
          >
            <ProdutoImagem
              fotoUrl={p.fotoUrl}
              nome={p.nome}
              categoria={p.categoriaNome}
              className="aspect-4/3"
            />
            <span className="flex flex-1 flex-col gap-1 p-3">
              <CategoriaBadge categoria={p.categoriaNome} />
              <span className="font-display text-sm leading-snug font-semibold">{p.nome}</span>
              <span className="mt-auto pt-1 text-sm font-medium">
                {p.valor === null ? (
                  <span className="text-muted-foreground font-normal">valor a definir</span>
                ) : (
                  <>
                    {p.tipoValor === 'medio' ? (
                      <span className="text-muted-foreground text-xs">a partir de </span>
                    ) : null}
                    {brl(p.valor)}
                  </>
                )}
              </span>
            </span>
          </button>
        ))}
        {produtos.length === 0 ? (
          <p className="text-muted-foreground col-span-full py-6 text-center text-sm">
            Nenhum produto com esse termo.
          </p>
        ) : null}
      </div>

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
            {entrega.complemento ? ` — ${entrega.complemento}` : ''}
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

/** Coluna lateral com o que já foi escolhido — visível em todas as etapas. */
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
