'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SituacaoOperacional } from '@prisma/client'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialogo } from '@/components/ui/dialogo'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { definirStatusDaSemana } from '@/lib/actions/logistica'
import { ROTULO_SITUACAO, SITUACOES } from '@/lib/logistica/status-operacional'

/**
 * Definição manual do status da semana.
 *
 * "Automático" é uma opção como as outras, e não um botão escondido: é como a
 * Logística devolve a semana para os números depois de um evento.
 */
export function DefinirStatus({
  ano,
  semana,
  rotuloDaSemana,
  situacaoAtual,
  observacaoAtual,
  sugestao,
}: {
  ano: number
  semana: number
  rotuloDaSemana: string
  situacaoAtual: SituacaoOperacional | null
  observacaoAtual: string | null
  sugestao: string
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()
  const [escolha, setEscolha] = useState<string>(situacaoAtual ?? 'automatico')

  function enviar(formulario: FormData) {
    setErro(null)
    iniciar(async () => {
      const r = await definirStatusDaSemana(formulario)
      if (!r.ok) return setErro(r.erro)
      setAberto(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        Definir manualmente
      </Button>

      <Dialogo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={`Status da semana ${rotuloDaSemana}`}
        descricao="Vale para todos que abrem o painel. Os números continuam aparecendo ao lado."
      >
        <form action={enviar} className="space-y-5">
          <input type="hidden" name="ano" value={ano} />
          <input type="hidden" name="semana" value={semana} />

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Situação</legend>
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <input
                type="radio"
                name="situacao"
                value="automatico"
                checked={escolha === 'automatico'}
                onChange={() => setEscolha('automatico')}
                className="accent-primary mt-0.5 size-4"
              />
              <span>
                <span className="font-medium">Seguir os números</span>
                <span className="text-muted-foreground block text-xs">Hoje: {sugestao}.</span>
              </span>
            </label>
            {SITUACOES.map((s) => (
              <label key={s} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <input
                  type="radio"
                  name="situacao"
                  value={s}
                  checked={escolha === s}
                  onChange={() => setEscolha(s)}
                  className="accent-primary size-4"
                />
                {ROTULO_SITUACAO[s]}
              </label>
            ))}
          </fieldset>

          {escolha !== 'automatico' ? (
            <div className="space-y-1.5">
              <Label htmlFor="status-observacao">Por quê (opcional)</Label>
              <Textarea
                id="status-observacao"
                name="observacao"
                defaultValue={observacaoAtual ?? ''}
                maxLength={280}
                rows={2}
                placeholder="Ex.: semana do evento de lançamento da Escola."
              />
              <p className="text-muted-foreground text-xs">Aparece no painel no lugar do motivo.</p>
            </div>
          ) : null}

          {erro ? (
            <p role="alert" className="text-destructive text-sm">
              {erro}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Salvar
            </Button>
          </div>
        </form>
      </Dialogo>
    </>
  )
}
