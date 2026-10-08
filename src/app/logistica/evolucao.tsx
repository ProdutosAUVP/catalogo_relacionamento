'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export type PontoDaEvolucao = { rotulo: string; rotuloLongo: string; quantidade: number }

/** Teto do eixo num número redondo: 0, 5, 10, 15, 20, e não 0, 4,25, 8,5... */
function escala(maximo: number): { teto: number; passos: number[] } {
  if (maximo <= 0) return { teto: 4, passos: [0, 1, 2, 3, 4] }
  const bruto = maximo / 4
  const ordem = 10 ** Math.floor(Math.log10(bruto))
  const passo = Math.max(1, ([1, 2, 5, 10].find((m) => m * ordem >= bruto) ?? 10) * ordem)
  const teto = Math.ceil(maximo / passo) * passo
  return { teto, passos: Array.from({ length: teto / passo + 1 }, (_, i) => i * passo) }
}

const plural = (n: number) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`

/**
 * Evolução do volume no período (proposta, item 1).
 *
 * Linha de uma série só, então sem legenda: o título diz o que é. O desenho
 * é dividido em duas camadas para não depender de medir a tela:
 *
 * - o SVG desenha grade, área e linha num sistema de 0 a 100 esticado até o
 *   tamanho do bloco, com traço que não estica (`non-scaling-stroke`);
 * - textos, marcadores e áreas de toque são HTML posicionados em percentual,
 *   para não deformarem junto. O bloco tem altura fixa, e nada mexe no layout
 *   quando a página carrega.
 *
 * O cursor acha o ponto pela coluna inteira, e não pelo traço de 2 px; o
 * teclado chega pelo mesmo botão de cada coluna. A tabela embaixo leva os
 * mesmos números para quem não usa o gráfico.
 */
export function Evolucao({ pontos, apoio }: { pontos: PontoDaEvolucao[]; apoio: string }) {
  const [ativo, setAtivo] = useState<number | null>(null)
  const { teto, passos } = escala(Math.max(...pontos.map((p) => p.quantidade)))

  const x = (i: number) => (pontos.length === 1 ? 50 : (i / (pontos.length - 1)) * 100)
  const y = (v: number) => 100 - (v / teto) * 100

  const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.quantidade)}`).join(' ')
  const area = `${linha} L${x(pontos.length - 1)},100 L${x(0)},100 Z`
  const ultimo = pontos.length - 1
  // Com muitas fatias, um rótulo sim, outro não, sempre mantendo o último.
  const saltar = pontos.length > 9

  return (
    <section aria-labelledby="evolucao" className="bg-card rounded-lg border p-5">
      <h2 id="evolucao" className="font-display text-lg font-semibold">
        Evolução do volume
      </h2>
      <p className="text-muted-foreground mt-0.5 mb-4 text-sm">{apoio}</p>

      <div className="relative h-[220px] select-none" onMouseLeave={() => setAtivo(null)}>
        {/* Eixo vertical: números redondos, discretos. */}
        {passos.map((v) => (
          <span
            key={v}
            className="text-muted-foreground absolute left-0 w-7 -translate-y-1/2 text-right text-xs tabular-nums"
            style={{ top: `calc(8px + (100% - 36px) * ${y(v) / 100})` }}
          >
            {v}
          </span>
        ))}

        <div className="absolute top-2 right-3 bottom-7 left-10">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            {passos.map((v) => (
              <line
                key={v}
                x1={0}
                x2={100}
                y1={y(v)}
                y2={y(v)}
                className="stroke-border"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={area} className="fill-serie" fillOpacity={0.1} />
            <path
              d={linha}
              fill="none"
              className="stroke-serie"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {ativo !== null ? (
            <span
              className="bg-foreground/25 pointer-events-none absolute inset-y-0 w-px"
              style={{ left: `${x(ativo)}%` }}
              aria-hidden="true"
            />
          ) : null}

          {pontos.map((p, i) => (
            <span
              key={p.rotulo}
              className={cn(
                'bg-serie ring-card pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-transform',
                ativo === i && 'scale-150',
              )}
              style={{ left: `${x(i)}%`, top: `${y(p.quantidade)}%` }}
              aria-hidden="true"
            />
          ))}

          {/* Valor no fim da linha, como pede o padrão: o resto fica no eixo e no cursor. */}
          {ativo === null && pontos.length > 0 ? (
            <span
              className="pointer-events-none absolute -translate-x-full -translate-y-[160%] pr-1 text-sm font-semibold tabular-nums"
              style={{ left: `${x(ultimo)}%`, top: `${y(pontos[ultimo]!.quantidade)}%` }}
              aria-hidden="true"
            >
              {pontos[ultimo]!.quantidade}
            </span>
          ) : null}

          {ativo !== null ? (
            <div
              role="status"
              className={cn(
                'bg-popover pointer-events-none absolute z-10 mb-3 rounded-lg border px-3 py-2 text-xs whitespace-nowrap shadow-lg',
                x(ativo) < 20 ? '' : x(ativo) > 80 ? '-translate-x-full' : '-translate-x-1/2',
              )}
              style={{
                left: `${x(ativo)}%`,
                bottom: `calc(${100 - y(pontos[ativo]!.quantidade)}% + 10px)`,
              }}
            >
              <span className="flex items-center gap-2">
                <span className="bg-serie h-0.5 w-3 rounded-full" aria-hidden="true" />
                <span className="text-sm font-semibold tabular-nums">
                  {plural(pontos[ativo]!.quantidade)}
                </span>
              </span>
              <span className="text-muted-foreground block">{pontos[ativo]!.rotuloLongo}</span>
            </div>
          ) : null}

          {/* Uma coluna inteira por ponto é a área de toque. */}
          <div className="absolute inset-0 flex">
            {pontos.map((p, i) => (
              <button
                key={p.rotulo}
                type="button"
                aria-label={`${p.rotuloLongo}: ${plural(p.quantidade)}`}
                className="focus-visible:ring-ring h-full flex-1 rounded-sm outline-none focus-visible:ring-2"
                onMouseEnter={() => setAtivo(i)}
                onFocus={() => setAtivo(i)}
                onBlur={() => setAtivo(null)}
              />
            ))}
          </div>
        </div>

        {/* Eixo horizontal. */}
        <div className="absolute right-3 bottom-0 left-10 h-5">
          {pontos.map((p, i) =>
            saltar && i % 2 !== ultimo % 2 ? null : (
              <span
                key={p.rotulo}
                className={cn(
                  'text-muted-foreground absolute -translate-x-1/2 text-xs whitespace-nowrap tabular-nums',
                  // No celular não cabem todos: um sim, outro não, terminando no último.
                  (ultimo - i) % 2 !== 0 && 'max-sm:hidden',
                )}
                style={{ left: `${x(i)}%` }}
              >
                {p.rotulo}
              </span>
            ),
          )}
        </div>
      </div>

      <details className="mt-3 text-sm">
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
          Ver em tabela
        </summary>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-xs">
              <th className="py-1.5 font-medium">Período</th>
              <th className="py-1.5 text-right font-medium">Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {pontos.map((p) => (
              <tr key={p.rotulo} className="border-b last:border-0">
                <td className="py-1.5">{p.rotuloLongo}</td>
                <td className="py-1.5 text-right tabular-nums">{p.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}
