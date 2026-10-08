import { instanteLocal, partesLocais } from './datas'

/**
 * O período do Dashboard Logístico: semana, mês, ano ou datas livres.
 *
 * Um lugar só porque o mesmo período filtra o painel inteiro, a exportação e
 * o status da semana, e um gráfico que conta a semana de um jeito e uma
 * planilha que conta de outro é o tipo de divergência que ninguém percebe até
 * a reunião de diretoria.
 *
 * Duas escolhas:
 *
 * - **semana ISO**, de segunda a domingo, numerada como `2026-34`. É o que o
 *   protótipo mostra e o que o ClickUp e as planilhas da área usam. A semana
 *   pertence ao ano da sua quinta-feira, então 01/01/2027, uma sexta, ainda é
 *   a semana 53 de 2026;
 * - **calendário de São Paulo.** O banco guarda UTC, e um envio de domingo às
 *   23h não pode cair na segunda-feira seguinte.
 *
 * Todo intervalo é `[inicio, fim)`, em instantes UTC, como em `datas.ts`.
 */

export const TIPOS_DE_PERIODO = ['semana', 'mes', 'ano', 'personalizado'] as const
export type TipoDePeriodo = (typeof TIPOS_DE_PERIODO)[number]

export const ROTULO_TIPO_DE_PERIODO: Record<TipoDePeriodo, string> = {
  semana: 'Semanal',
  mes: 'Mensal',
  ano: 'Anual',
  personalizado: 'Personalizado',
}

/** O período como ele mora na URL: `?periodo=semana&ref=2026-W34`. */
export type ParametrosDePeriodo = {
  periodo: TipoDePeriodo
  ref?: string
  de?: string
  ate?: string
}

export type Periodo = {
  tipo: TipoDePeriodo
  inicio: Date
  fim: Date
  /** "Semana 2026-34", "Agosto de 2026", "2026", "01/08/2026 a 31/08/2026". */
  rotulo: string
  /** Os dias cobertos, "17/08 – 23/08". Vazio quando o rótulo já diz tudo. */
  detalhe: string
  params: ParametrosDePeriodo
  anterior: ParametrosDePeriodo
  proximo: ParametrosDePeriodo
  /** O mesmo tipo de período, no ponto que contém hoje. */
  atual: ParametrosDePeriodo
  /** Preenchido quando a URL pediu algo inválido e o período foi corrigido. */
  aviso?: string
}

/** Uma fatia do período, um ponto do gráfico de evolução. */
export type Fatia = { chave: string; rotulo: string; rotuloLongo: string; inicio: Date; fim: Date }

/**
 * Teto do período personalizado. Três anos cobrem qualquer comparação que a
 * área pediu e impedem que um `de=1900-01-01` varra o banco inteiro.
 */
const MAXIMO_DE_DIAS_PERSONALIZADO = 366 * 3

/** Acima disso, o gráfico de evolução troca semanas por meses. */
const MAXIMO_DE_SEMANAS_NO_GRAFICO = 16

/** Quantas semanas o gráfico mostra quando o filtro é uma semana só. */
export const SEMANAS_DE_CONTEXTO = 8

const DIA_MS = 86_400_000

// ---------------------------------------------------------------------------
// Dias do calendário local, sem horário
// ---------------------------------------------------------------------------

type Dia = { ano: number; mes: number; dia: number }

/** Aritmética de calendário em UTC puro: dia é dia, sem fuso nem horário. */
function somarDias(d: Dia, n: number): Dia {
  const data = new Date(Date.UTC(d.ano, d.mes - 1, d.dia) + n * DIA_MS)
  return { ano: data.getUTCFullYear(), mes: data.getUTCMonth() + 1, dia: data.getUTCDate() }
}

function diasEntre(a: Dia, b: Dia): number {
  return Math.round(
    (Date.UTC(b.ano, b.mes - 1, b.dia) - Date.UTC(a.ano, a.mes - 1, a.dia)) / DIA_MS,
  )
}

function inicioDoDia(d: Dia): Date {
  return instanteLocal(d.ano, d.mes, d.dia)
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

function diaIso(d: Dia): string {
  return `${d.ano}-${doisDigitos(d.mes)}-${doisDigitos(d.dia)}`
}

function lerDiaIso(texto: string | undefined): Dia | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '')
  if (!m) return null
  const d = { ano: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) }
  // 2026-02-31 passaria na expressão; a volta pelo Date denuncia.
  const conferido = somarDias(d, 0)
  return conferido.ano === d.ano && conferido.mes === d.mes && conferido.dia === d.dia ? d : null
}

const diaCurto = (d: Dia) => `${doisDigitos(d.dia)}/${doisDigitos(d.mes)}`
const diaLongo = (d: Dia) => `${diaCurto(d)}/${d.ano}`

const NOMES_DOS_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

// ---------------------------------------------------------------------------
// Semana ISO
// ---------------------------------------------------------------------------

export type SemanaIso = { ano: number; semana: number }

function semanaDoDia(d: Dia): SemanaIso {
  const data = new Date(Date.UTC(d.ano, d.mes - 1, d.dia))
  const diaDaSemana = (data.getUTCDay() + 6) % 7 // segunda = 0
  // A semana é do ano em que cai a sua quinta-feira.
  const quinta = new Date(data.getTime() + (3 - diaDaSemana) * DIA_MS)
  const ano = quinta.getUTCFullYear()
  const semana = Math.floor((quinta.getTime() - Date.UTC(ano, 0, 1)) / DIA_MS / 7) + 1
  return { ano, semana }
}

/** Semana ISO de um instante, no calendário de São Paulo. */
export function semanaIso(instante: Date): SemanaIso {
  return semanaDoDia(partesLocais(instante))
}

/** 52 ou 53: o ano tem 53 semanas quando 28/12 cai na semana 53. */
export function semanasNoAno(ano: number): number {
  return semanaDoDia({ ano, mes: 12, dia: 28 }).semana
}

function segundaDaSemana({ ano, semana }: SemanaIso): Dia {
  const quatroDeJaneiro = { ano, mes: 1, dia: 4 }
  const diaDaSemana = (new Date(Date.UTC(ano, 0, 4)).getUTCDay() + 6) % 7
  return somarDias(quatroDeJaneiro, (semana - 1) * 7 - diaDaSemana)
}

/** `2026-W34`, o formato da URL e o do `<input type="week">`. */
export function chaveDaSemana({ ano, semana }: SemanaIso): string {
  return `${ano}-W${doisDigitos(semana)}`
}

/** `2026-34`, como a área escreve e o protótipo mostra. */
export function rotuloDaSemana({ ano, semana }: SemanaIso): string {
  return `${ano}-${doisDigitos(semana)}`
}

function lerSemana(texto: string | undefined): SemanaIso | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(texto ?? '')
  if (!m) return null
  const s = { ano: Number(m[1]), semana: Number(m[2]) }
  return s.semana >= 1 && s.semana <= semanasNoAno(s.ano) ? s : null
}

function somarSemanas(s: SemanaIso, n: number): SemanaIso {
  return semanaDoDia(somarDias(segundaDaSemana(s), n * 7))
}

/** Intervalo `[segunda 00:00, segunda seguinte 00:00)` da semana. */
export function intervaloDaSemana(s: SemanaIso): { inicio: Date; fim: Date } {
  const segunda = segundaDaSemana(s)
  return { inicio: inicioDoDia(segunda), fim: inicioDoDia(somarDias(segunda, 7)) }
}

// ---------------------------------------------------------------------------
// Período a partir da URL
// ---------------------------------------------------------------------------

function periodoDaSemana(s: SemanaIso): Omit<Periodo, 'atual' | 'aviso'> {
  const segunda = segundaDaSemana(s)
  const domingo = somarDias(segunda, 6)
  return {
    tipo: 'semana',
    ...intervaloDaSemana(s),
    rotulo: `Semana ${rotuloDaSemana(s)}`,
    detalhe: `${diaCurto(segunda)} – ${diaCurto(domingo)}`,
    params: { periodo: 'semana', ref: chaveDaSemana(s) },
    anterior: { periodo: 'semana', ref: chaveDaSemana(somarSemanas(s, -1)) },
    proximo: { periodo: 'semana', ref: chaveDaSemana(somarSemanas(s, 1)) },
  }
}

function chaveDoMes(ano: number, mes: number): string {
  return `${ano}-${doisDigitos(mes)}`
}

function periodoDoMes(ano: number, mes: number): Omit<Periodo, 'atual' | 'aviso'> {
  const seguinte = mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 }
  const anterior = mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 }
  return {
    tipo: 'mes',
    inicio: instanteLocal(ano, mes, 1),
    fim: instanteLocal(seguinte.ano, seguinte.mes, 1),
    rotulo: `${maiuscula(NOMES_DOS_MESES[mes - 1]!)} de ${ano}`,
    detalhe: '',
    params: { periodo: 'mes', ref: chaveDoMes(ano, mes) },
    anterior: { periodo: 'mes', ref: chaveDoMes(anterior.ano, anterior.mes) },
    proximo: { periodo: 'mes', ref: chaveDoMes(seguinte.ano, seguinte.mes) },
  }
}

function periodoDoAno(ano: number): Omit<Periodo, 'atual' | 'aviso'> {
  return {
    tipo: 'ano',
    inicio: instanteLocal(ano, 1, 1),
    fim: instanteLocal(ano + 1, 1, 1),
    rotulo: String(ano),
    detalhe: '',
    params: { periodo: 'ano', ref: String(ano) },
    anterior: { periodo: 'ano', ref: String(ano - 1) },
    proximo: { periodo: 'ano', ref: String(ano + 1) },
  }
}

/** `ate` é o último dia incluído, como a área lê "de 01/08 a 31/08". */
function periodoPersonalizado(de: Dia, ate: Dia): Omit<Periodo, 'atual' | 'aviso'> {
  const dias = diasEntre(de, ate) + 1
  const params = (inicio: Dia): ParametrosDePeriodo => ({
    periodo: 'personalizado',
    de: diaIso(inicio),
    ate: diaIso(somarDias(inicio, dias - 1)),
  })
  return {
    tipo: 'personalizado',
    inicio: inicioDoDia(de),
    fim: inicioDoDia(somarDias(ate, 1)),
    rotulo: `${diaLongo(de)} a ${diaLongo(ate)}`,
    detalhe: `${dias} ${dias === 1 ? 'dia' : 'dias'}`,
    params: params(de),
    // Anterior e próximo andam o mesmo número de dias, para comparar igual com igual.
    anterior: params(somarDias(de, -dias)),
    proximo: params(somarDias(de, dias)),
  }
}

function parametrosDoAtual(tipo: TipoDePeriodo, hoje: Dia): ParametrosDePeriodo {
  if (tipo === 'mes') return { periodo: 'mes', ref: chaveDoMes(hoje.ano, hoje.mes) }
  if (tipo === 'ano') return { periodo: 'ano', ref: String(hoje.ano) }
  // "Atual" no personalizado não tem um sentido único; a semana é o ponto de partida.
  return { periodo: 'semana', ref: chaveDaSemana(semanaDoDia(hoje)) }
}

/**
 * Lê o período dos parâmetros da URL.
 *
 * Nunca lança: link velho, digitado à mão ou com data impossível vira a
 * semana atual, com `aviso` dizendo o que foi corrigido. Uma tela de erro por
 * causa de um filtro seria pior que o filtro ignorado.
 */
export function lerPeriodo(
  params: { periodo?: string; ref?: string; de?: string; ate?: string },
  agora: Date = new Date(),
): Periodo {
  const hoje = partesLocais(agora)
  const tipo = (TIPOS_DE_PERIODO as readonly string[]).includes(params.periodo ?? '')
    ? (params.periodo as TipoDePeriodo)
    : 'semana'

  const comAtual = (p: Omit<Periodo, 'atual' | 'aviso'>, aviso?: string): Periodo => ({
    ...p,
    atual: parametrosDoAtual(p.tipo, hoje),
    ...(aviso ? { aviso } : {}),
  })
  const semanaAtual = (aviso?: string) => comAtual(periodoDaSemana(semanaDoDia(hoje)), aviso)

  if (tipo === 'semana') {
    if (!params.ref) return semanaAtual()
    const semana = lerSemana(params.ref)
    return semana ? comAtual(periodoDaSemana(semana)) : semanaAtual('Semana inválida no endereço.')
  }

  if (tipo === 'mes') {
    if (!params.ref) return comAtual(periodoDoMes(hoje.ano, hoje.mes))
    const m = /^(\d{4})-(\d{2})$/.exec(params.ref)
    const mes = m ? Number(m[2]) : 0
    return m && mes >= 1 && mes <= 12
      ? comAtual(periodoDoMes(Number(m[1]), mes))
      : semanaAtual('Mês inválido no endereço.')
  }

  if (tipo === 'ano') {
    if (!params.ref) return comAtual(periodoDoAno(hoje.ano))
    return /^\d{4}$/.test(params.ref)
      ? comAtual(periodoDoAno(Number(params.ref)))
      : semanaAtual('Ano inválido no endereço.')
  }

  const de = lerDiaIso(params.de)
  const ate = lerDiaIso(params.ate)
  if (!de || !ate) return semanaAtual('Informe a data inicial e a final do período.')
  if (diasEntre(de, ate) < 0) return semanaAtual('A data final vem antes da inicial.')
  if (diasEntre(de, ate) + 1 > MAXIMO_DE_DIAS_PERSONALIZADO) {
    return semanaAtual('O período personalizado vai até três anos.')
  }
  return comAtual(periodoPersonalizado(de, ate))
}

/** Os parâmetros de volta para a URL, sem chaves vazias. */
export function queryDoPeriodo(p: ParametrosDePeriodo): string {
  const busca = new URLSearchParams({ periodo: p.periodo })
  if (p.ref) busca.set('ref', p.ref)
  if (p.de) busca.set('de', p.de)
  if (p.ate) busca.set('ate', p.ate)
  return busca.toString()
}

// ---------------------------------------------------------------------------
// Fatias para o gráfico de evolução
// ---------------------------------------------------------------------------

function fatiaDaSemana(s: SemanaIso): Fatia {
  const p = periodoDaSemana(s)
  return {
    chave: rotuloDaSemana(s),
    rotulo: rotuloDaSemana(s),
    rotuloLongo: `${p.rotulo} (${p.detalhe})`,
    inicio: p.inicio,
    fim: p.fim,
  }
}

const recortar = (f: Fatia, inicio: Date, fim: Date): Fatia => ({
  ...f,
  inicio: f.inicio < inicio ? inicio : f.inicio,
  fim: f.fim > fim ? fim : f.fim,
})

function semanasQueTocam(inicio: Date, fim: Date): Fatia[] {
  const fatias: Fatia[] = []
  let s = semanaIso(inicio)
  // Limite de segurança: o período personalizado já vem limitado a três anos.
  for (let i = 0; i < 200; i++) {
    const f = fatiaDaSemana(s)
    if (f.inicio >= fim) break
    fatias.push(recortar(f, inicio, fim))
    s = somarSemanas(s, 1)
  }
  return fatias
}

function mesesQueTocam(inicio: Date, fim: Date): Fatia[] {
  const fatias: Fatia[] = []
  let { ano, mes } = partesLocais(inicio)
  for (let i = 0; i < 48; i++) {
    const p = periodoDoMes(ano, mes)
    if (p.inicio >= fim) break
    fatias.push(
      recortar(
        {
          chave: chaveDoMes(ano, mes),
          rotulo: `${NOMES_DOS_MESES[mes - 1]!.slice(0, 3)}${ano === partesLocais(inicio).ano ? '' : `/${String(ano).slice(2)}`}`,
          rotuloLongo: p.rotulo,
          inicio: p.inicio,
          fim: p.fim,
        },
        inicio,
        fim,
      ),
    )
    ;({ ano, mes } = mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 })
  }
  return fatias
}

/**
 * Os pontos do gráfico de evolução.
 *
 * Uma semana sozinha não tem evolução, então ela vem com as sete anteriores,
 * como no protótipo. O mês mostra as suas semanas; o ano, os seus meses; e o
 * personalizado escolhe pelo tamanho, para o gráfico não virar um pente.
 * Semanas que passam da borda do período são recortadas: a semana que começa
 * em 28/07 conta, num filtro de agosto, só a partir de 01/08.
 */
export function fatiasDoPeriodo(periodo: Periodo): Fatia[] {
  if (periodo.tipo === 'semana') {
    const atual = semanaIso(periodo.inicio)
    return Array.from({ length: SEMANAS_DE_CONTEXTO }, (_, i) =>
      fatiaDaSemana(somarSemanas(atual, i - SEMANAS_DE_CONTEXTO + 1)),
    )
  }
  if (periodo.tipo === 'ano') return mesesQueTocam(periodo.inicio, periodo.fim)

  const semanas = semanasQueTocam(periodo.inicio, periodo.fim)
  return semanas.length > MAXIMO_DE_SEMANAS_NO_GRAFICO
    ? mesesQueTocam(periodo.inicio, periodo.fim)
    : semanas
}

/**
 * O período do tipo pedido que contém o início do período atual.
 *
 * Quem está olhando a semana 34 e clica em "Mensal" quer agosto, não o mês de
 * hoje. "Personalizado" parte das mesmas datas do que está na tela.
 */
export function trocarTipo(periodo: Periodo, tipo: TipoDePeriodo): ParametrosDePeriodo {
  const inicio = partesLocais(periodo.inicio)
  if (tipo === 'semana') return { periodo: 'semana', ref: chaveDaSemana(semanaDoDia(inicio)) }
  if (tipo === 'mes') return { periodo: 'mes', ref: chaveDoMes(inicio.ano, inicio.mes) }
  if (tipo === 'ano') return { periodo: 'ano', ref: String(inicio.ano) }
  const ultimoDia = partesLocais(new Date(periodo.fim.getTime() - 1))
  return { periodo: 'personalizado', de: diaIso(inicio), ate: diaIso(ultimoDia) }
}
