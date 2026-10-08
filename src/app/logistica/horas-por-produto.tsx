import { formatarDuracao, type LinhaDeHoras } from '@/lib/logistica/demandas'
import { TituloDoBloco } from './pecas'

/**
 * Horas operacionais por produto (proposta, item 2).
 *
 * Tabela, e não gráfico: são três números por produto, horas, envios e tempo
 * médio, e a pergunta da proposta é "onde está o esforço", lida melhor em
 * linha do que em três gráficos. A barra fina ao lado das horas só dá a
 * proporção num relance.
 */
export function HorasPorProduto({
  linhas,
  totalMinutos,
}: {
  linhas: LinhaDeHoras[]
  totalMinutos: number
}) {
  const maior = Math.max(1, ...linhas.map((l) => l.minutos))

  return (
    <section aria-labelledby="horas-por-produto" className="bg-card rounded-lg border p-5">
      <div id="horas-por-produto">
        <TituloDoBloco
          titulo="Horas por produto"
          apoio={
            linhas.length
              ? `${formatarDuracao(totalMinutos)} apontadas no período.`
              : 'Tempo apontado nas tarefas do período.'
          }
        />
      </div>

      {linhas.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Sem apontamentos nesta janela.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-xs">
              <th className="py-2 font-medium">Produto</th>
              <th className="py-2 font-medium">Horas</th>
              <th className="py-2 text-right font-medium">Envios</th>
              <th className="py-2 text-right font-medium">Média por envio</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.produto} className="border-b last:border-0">
                <td className="py-2.5 pr-3">{l.produto}</td>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="w-14 tabular-nums">{formatarDuracao(l.minutos)}</span>
                    <span className="hidden h-2 flex-1 sm:block" aria-hidden="true">
                      <span
                        className="bg-serie block h-full rounded-r-[4px]"
                        style={{ width: `${(l.minutos / maior) * 100}%` }}
                      />
                    </span>
                  </span>
                </td>
                <td className="py-2.5 text-right tabular-nums">{l.envios}</td>
                <td className="py-2.5 text-right tabular-nums">
                  {l.mediaPorEnvio === null ? '-' : formatarDuracao(l.mediaPorEnvio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
