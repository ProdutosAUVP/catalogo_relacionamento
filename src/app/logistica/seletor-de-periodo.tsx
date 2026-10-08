import type { Route } from 'next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  queryDoPeriodo,
  ROTULO_TIPO_DE_PERIODO,
  TIPOS_DE_PERIODO,
  trocarTipo,
  type ParametrosDePeriodo,
  type Periodo,
} from '@/lib/periodo'
import { BotaoDeFiltro, FormDeFiltro, LinkDeFiltro } from '@/components/filtro-sem-piscar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const ROTULO_DO_ATUAL: Record<Periodo['tipo'], string> = {
  semana: 'Semana atual',
  mes: 'Mês atual',
  ano: 'Ano atual',
  personalizado: 'Semana atual',
}

const hrefDo = (p: ParametrosDePeriodo) => `/logistica?${queryDoPeriodo(p)}` as Route

/**
 * O filtro global do Dashboard Logístico.
 *
 * Fica no topo e vale para o painel inteiro e para a exportação, que lê a
 * mesma URL. Trocar de período é filtro da mesma tela, então tudo navega por
 * `LinkDeFiltro` e `FormDeFiltro`, sem recarregar a aplicação.
 */
export function SeletorDePeriodo({ periodo }: { periodo: Periodo }) {
  return (
    <div className="bg-card mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border p-3">
      <nav aria-label="Tipo de período" className="flex flex-wrap gap-1">
        {TIPOS_DE_PERIODO.map((tipo) => {
          const ativo = periodo.tipo === tipo
          return (
            <Button key={tipo} size="sm" variant={ativo ? 'secondary' : 'ghost'} asChild>
              <LinkDeFiltro
                href={hrefDo(trocarTipo(periodo, tipo))}
                aria-current={ativo ? 'true' : undefined}
              >
                {ROTULO_TIPO_DE_PERIODO[tipo]}
              </LinkDeFiltro>
            </Button>
          )
        })}
      </nav>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="text-right leading-tight">
          <p className="font-display text-base font-semibold">{periodo.rotulo}</p>
          {periodo.detalhe ? (
            <p className="text-muted-foreground text-xs tabular-nums">{periodo.detalhe}</p>
          ) : null}
        </div>

        <nav aria-label="Navegar no período" className="bg-muted flex rounded-md p-0.5">
          <Button size="sm" variant="ghost" asChild>
            <LinkDeFiltro href={hrefDo(periodo.anterior)} aria-label="Período anterior">
              <ChevronLeft aria-hidden="true" />
              Anterior
            </LinkDeFiltro>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <LinkDeFiltro href={hrefDo(periodo.atual)}>
              {ROTULO_DO_ATUAL[periodo.tipo]}
            </LinkDeFiltro>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <LinkDeFiltro href={hrefDo(periodo.proximo)} aria-label="Próximo período">
              {periodo.tipo === 'semana' ? 'Próxima' : 'Próximo'}
              <ChevronRight aria-hidden="true" />
            </LinkDeFiltro>
          </Button>
        </nav>
      </div>

      {periodo.tipo === 'personalizado' ? (
        <FormDeFiltro
          acao="/logistica"
          className={cn('flex w-full flex-wrap items-end gap-3 border-t pt-3')}
        >
          <input type="hidden" name="periodo" value="personalizado" />
          <label className="grid gap-1.5 text-sm font-medium">
            Data inicial
            <Input
              type="date"
              name="de"
              defaultValue={periodo.params.de}
              required
              className="w-44"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Data final
            <Input
              type="date"
              name="ate"
              defaultValue={periodo.params.ate}
              required
              className="w-44"
            />
          </label>
          <BotaoDeFiltro>Aplicar</BotaoDeFiltro>
        </FormDeFiltro>
      ) : null}
    </div>
  )
}
