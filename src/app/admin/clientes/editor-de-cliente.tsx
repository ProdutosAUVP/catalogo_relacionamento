'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialogo } from '@/components/ui/dialogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatarCpf } from '@/lib/cpf'
import { salvarCliente } from '@/lib/actions/clientes'

/**
 * Cadastro e edição de cliente.
 *
 * Não existe excluir: o cliente aparece em solicitações antigas, que precisam
 * continuar legíveis. O CPF é a chave de deduplicação — a action recusa um CPF
 * que já pertence a outro cadastro em vez de criar o segundo.
 */

export type ClienteEditavel = {
  id: string
  nome: string
  cpf: string
  telefone: string | null
  email: string | null
}

export function EditorDeCliente({ cliente }: { cliente?: ClienteEditavel }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [salvando, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  const editando = Boolean(cliente)

  /**
   * `onSubmit`, e não `action`: React limpa o formulário depois de rodar a
   * action, e uma recusa do servidor apagaria o que a pessoa digitou.
   */
  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    setErro(null)
    iniciar(async () => {
      const r = await salvarCliente(dados)
      if (!r.ok) return setErro(r.erro)
      setAberto(false)
      router.refresh()
    })
  }

  return (
    <>
      {editando ? (
        <Button variant="ghost" size="sm" onClick={() => setAberto(true)}>
          <Pencil aria-hidden="true" />
          Editar
        </Button>
      ) : (
        <Button onClick={() => setAberto(true)}>
          <Plus aria-hidden="true" />
          Novo cliente
        </Button>
      )}

      <Dialogo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={editando ? 'Editar cliente' : 'Novo cliente'}
        descricao="O endereço não fica aqui: ele é gravado em cada solicitação, para que uma mudança de casa não reescreva o histórico."
      >
        <form onSubmit={enviar} className="space-y-5">
          {cliente ? <input type="hidden" name="id" value={cliente.id} /> : null}

          <div className="space-y-1.5">
            <Label htmlFor="cliente-nome">Nome completo</Label>
            <Input id="cliente-nome" name="nome" required defaultValue={cliente?.nome} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-cpf">CPF</Label>
              <Input
                id="cliente-cpf"
                name="cpf"
                required
                inputMode="numeric"
                placeholder="000.000.000-00"
                defaultValue={cliente ? formatarCpf(cliente.cpf) : ''}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cliente-telefone">Telefone</Label>
              <Input
                id="cliente-telefone"
                name="telefone"
                inputMode="numeric"
                placeholder="(11) 90000-0000"
                defaultValue={cliente?.telefone ?? ''}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cliente-email">E-mail</Label>
              <Input
                id="cliente-email"
                name="email"
                type="email"
                defaultValue={cliente?.email ?? ''}
              />
            </div>
          </div>

          {erro ? (
            <p role="alert" className="text-destructive text-sm">
              {erro}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {salvando ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialogo>
    </>
  )
}
