import type { StatusSolicitacao } from '@prisma/client'
import { ROTULO_STATUS } from '@/lib/status'
import { formatarDataHora } from '@/lib/datas'

/**
 * Histórico da solicitação como linha do tempo.
 *
 * O histórico responde "por que essa solicitação parou". Uma lista de blocos
 * soltos obriga a pessoa a reconstruir a ordem; a linha vertical mostra a
 * sequência de uma vez, e o marcador cheio no topo diz onde a solicitação está
 * agora.
 */
export type LinhaDeHistorico = {
  id: string
  statusAnterior: StatusSolicitacao | null
  statusNovo: StatusSolicitacao
  motivo: string | null
  criadoEm: Date
  autor: string
}

export function LinhaDoTempo({ linhas }: { linhas: readonly LinhaDeHistorico[] }) {
  return (
    <ol className="relative">
      {linhas.map((linha, indice) => {
        const atual = indice === 0
        const ultimo = indice === linhas.length - 1

        return (
          <li key={linha.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* A haste liga um marcador ao próximo; some no último item. */}
            {!ultimo ? (
              <span
                className="bg-border absolute top-3 left-[5px] h-full w-px"
                aria-hidden="true"
              />
            ) : null}

            <span
              className={
                atual
                  ? 'bg-primary ring-background relative mt-1.5 size-2.5 shrink-0 rounded-full ring-4'
                  : 'bg-border ring-background relative mt-1.5 size-2.5 shrink-0 rounded-full ring-4'
              }
              aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {linha.statusAnterior ? (
                  <span className="text-muted-foreground">
                    {ROTULO_STATUS[linha.statusAnterior]} <span aria-hidden="true">→</span>{' '}
                  </span>
                ) : null}
                <span className="font-medium">{ROTULO_STATUS[linha.statusNovo]}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatarDataHora(linha.criadoEm)} · {linha.autor}
              </p>
              {linha.motivo ? (
                <p className="bg-muted/60 mt-2 rounded-md px-3 py-2 text-sm text-pretty">
                  {linha.motivo}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
