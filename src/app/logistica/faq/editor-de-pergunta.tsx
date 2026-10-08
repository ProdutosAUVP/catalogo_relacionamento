'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialogo } from '@/components/ui/dialogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { alternarPergunta, salvarPergunta } from '@/lib/actions/logistica'

export type PerguntaEditavel = {
  id: string
  pergunta: string
  resposta: string
  ordem: number
  ativo: boolean
}

/** Cadastro de pergunta frequente. Desativar tira do ar sem perder o texto. */
export function EditorDePergunta({ pergunta }: { pergunta?: PerguntaEditavel }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()

  function enviar(dados: FormData) {
    setErro(null)
    iniciar(async () => {
      const r = await salvarPergunta(dados)
      if (!r.ok) return setErro(r.erro)
      setAberto(false)
      router.refresh()
    })
  }

  function alternar() {
    if (!pergunta) return
    iniciar(async () => {
      const r = await alternarPergunta(pergunta.id, !pergunta.ativo)
      if (!r.ok) return setErro(r.erro)
      setAberto(false)
      router.refresh()
    })
  }

  return (
    <>
      {pergunta ? (
        <Button variant="ghost" size="sm" onClick={() => setAberto(true)}>
          <Pencil aria-hidden="true" />
          Editar
        </Button>
      ) : (
        <Button onClick={() => setAberto(true)}>
          <Plus aria-hidden="true" />
          Nova pergunta
        </Button>
      )}

      <Dialogo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={pergunta ? 'Editar pergunta' : 'Nova pergunta'}
        descricao="Aparece para todos que abrem o Dashboard Logístico."
      >
        <form action={enviar} className="space-y-4">
          {pergunta ? <input type="hidden" name="id" value={pergunta.id} /> : null}

          <div className="space-y-1.5">
            <Label htmlFor="faq-pergunta">Pergunta</Label>
            <Input
              id="faq-pergunta"
              name="pergunta"
              defaultValue={pergunta?.pergunta}
              maxLength={200}
              placeholder="Ex.: Qual o prazo para um envio nacional?"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="faq-resposta">Resposta</Label>
            <Textarea
              id="faq-resposta"
              name="resposta"
              defaultValue={pergunta?.resposta}
              rows={6}
              maxLength={4000}
              required
            />
          </div>

          <div className="max-w-28 space-y-1.5">
            <Label htmlFor="faq-ordem">Ordem</Label>
            <Input
              id="faq-ordem"
              name="ordem"
              type="number"
              min={0}
              defaultValue={pergunta?.ordem ?? 0}
            />
          </div>

          {erro ? (
            <p role="alert" className="text-destructive text-sm">
              {erro}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2">
            {pergunta ? (
              <Button type="button" variant="ghost" onClick={alternar} disabled={salvando}>
                {pergunta.ativo ? 'Tirar do ar' : 'Publicar de novo'}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </form>
      </Dialogo>
    </>
  )
}
