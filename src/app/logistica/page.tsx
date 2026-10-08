import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { lerPeriodo, queryDoPeriodo } from '@/lib/periodo'
import { formatarDuracao } from '@/lib/logistica/demandas'
import { painelLogistico } from '@/lib/logistica/painel'
import { CabecalhoDaPagina } from '@/components/pagina'
import { Stat } from '@/components/stat'
import { SeletorDePeriodo } from './seletor-de-periodo'
import { StatusDaSemana } from './status-da-semana'
import { VolumePorDepartamento } from './volume-por-departamento'
import { Evolucao } from './evolucao'
import { HorasPorProduto } from './horas-por-produto'
import { Trilha } from './trilha'

/** Já com a preposição: "à semana", "ao mês". */
const EM_RELACAO_AO_ANTERIOR = {
  semana: 'à semana anterior',
  mes: 'ao mês anterior',
  ano: 'ao ano anterior',
  personalizado: 'ao período anterior',
} as const

const APOIO_DA_EVOLUCAO = {
  semana: 'Pedidos por semana, nas oito semanas até a selecionada.',
  mes: 'Pedidos por semana dentro do mês.',
  ano: 'Pedidos por mês no ano.',
  personalizado: 'Pedidos ao longo do período escolhido.',
} as const

/**
 * Dashboard Logístico.
 *
 * Leitura rápida da operação para a empresa inteira, da operação à diretoria;
 * o detalhe de cada envio continua no ClickUp. A ordem dos blocos é a da
 * pergunta que cada um responde: está tudo bem? quanto chegou? onde está o
 * esforço? o que falta entregar? Ver docs/11-logistica.md.
 */
export default async function LogisticaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; ref?: string; de?: string; ate?: string }>
}) {
  const usuario = await exigirPermissao('logistica.ver')
  const periodo = lerPeriodo(await searchParams)
  const verObservacoes = pode(usuario.perfil, 'logistica.verObservacoes')

  const [painel, equipe, perguntas] = await Promise.all([
    painelLogistico(periodo, { verObservacoes }),
    db.membroEquipe.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      select: { id: true, nome: true, funcao: true },
    }),
    db.perguntaFrequente.count({ where: { ativo: true } }),
  ])

  const { volume } = painel
  const abertas = painel.trilha.demandas.filter((d) => d.fase !== 'concluido')
  const semPrevisao = abertas.filter((d) => !d.previsaoConclusao).length
  const atrasadas = abertas.filter((d) => d.atrasada).length
  const sinal = volume.variacao.diferenca > 0 ? '+' : ''

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Logística"
        titulo="Dashboard Logístico"
        descricao="Status da operação, volume de pedidos e a trilha de demandas do período. O detalhe de cada envio está no ClickUp."
      />

      <SeletorDePeriodo periodo={periodo} />

      {periodo.aviso ? (
        <p role="status" className="text-muted-foreground -mt-3 mb-6 text-sm">
          {periodo.aviso} Mostrando a semana atual.
        </p>
      ) : null}

      <StatusDaSemana
        status={painel.status}
        podeDefinir={pode(usuario.perfil, 'logistica.gerenciar')}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          destaque
          rotulo="Pedidos no período"
          valor={volume.total}
          apoio={
            volume.variacao.diferenca === 0
              ? `Igual ${EM_RELACAO_AO_ANTERIOR[periodo.tipo]}.`
              : `${sinal}${volume.variacao.diferenca}${
                  volume.variacao.percentual === null
                    ? ''
                    : ` (${sinal}${Math.round(volume.variacao.percentual)}%)`
                } em relação ${EM_RELACAO_AO_ANTERIOR[periodo.tipo]}.`
          }
        />
        <Stat
          rotulo="Em andamento"
          valor={abertas.length}
          apoio={`${atrasadas} ${atrasadas === 1 ? 'atrasada' : 'atrasadas'} · ${semPrevisao} sem previsão`}
        />
        <Stat
          rotulo="Horas apontadas"
          valor={formatarDuracao(painel.horas.totalMinutos)}
          apoio={
            volume.total
              ? `${formatarDuracao(painel.horas.totalMinutos / volume.total)} por pedido, em média.`
              : 'Nenhum pedido no período.'
          }
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <VolumePorDepartamento linhas={volume.porDepartamento} total={volume.total} />
        <Evolucao pontos={painel.evolucao} apoio={APOIO_DA_EVOLUCAO[periodo.tipo]} />
      </div>

      <div className="mb-6">
        <HorasPorProduto
          linhas={painel.horas.porProduto}
          totalMinutos={painel.horas.totalMinutos}
        />
      </div>

      <div className="mb-6">
        <Trilha
          demandas={painel.trilha.demandas}
          total={painel.trilha.total}
          exportar={queryDoPeriodo(periodo.params)}
          verObservacoes={verObservacoes}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/logistica/equipe"
          className="bg-card hover:border-foreground/20 group rounded-lg border p-5 transition-colors"
        >
          <p className="font-display flex items-center gap-1.5 text-lg font-semibold">
            Equipe de Logística
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {equipe.length
              ? equipe.map((m) => `${m.nome.split(' ')[0]} (${m.funcao})`).join(' · ')
              : 'Quem faz a operação acontecer.'}
          </p>
        </Link>
        <Link
          href="/logistica/faq"
          className="bg-card hover:border-foreground/20 group rounded-lg border p-5 transition-colors"
        >
          <p className="font-display flex items-center gap-1.5 text-lg font-semibold">
            Perguntas frequentes
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {perguntas
              ? `${perguntas} ${perguntas === 1 ? 'pergunta respondida' : 'perguntas respondidas'} pela Logística.`
              : 'Em elaboração pela equipe de Logística.'}
          </p>
        </Link>
      </div>
    </>
  )
}
