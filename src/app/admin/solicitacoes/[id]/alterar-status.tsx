'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StatusSolicitacao } from '@prisma/client'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ROTULO_STATUS, exigeMotivo } from '@/lib/status'
import { alterarStatus } from '@/lib/actions/solicitacoes'

/**
 * Mudança de status.
 *
 * As opções vêm prontas do servidor (`transicoesPermitidas`) e a action valida
 * de novo com a mesma função: o que a tela oferece e o que o servidor aceita
 * não podem divergir.
 *
 * `sugerido` é o próximo passo natural calculado a partir dos itens, quando
 * está tudo em estoque, a solicitação pula o Financeiro e vai para a expedição.
 * É só uma pré-seleção; quem decide é o Admin.
 */
export function AlterarStatus({
  solicitacaoId,
  opcoes,
  sugerido,
  explicacaoDoAtalho,
}: {
  solicitacaoId: string
  opcoes: StatusSolicitacao[]
  sugerido?: StatusSolicitacao
  explicacaoDoAtalho?: string
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()

  const padrao = sugerido && opcoes.includes(sugerido) ? sugerido : opcoes[0]

  // A escolha é guardada como "o que a pessoa clicou", não como o status em si.
  // Depois de gravar, a tela recarrega com outras opções, e uma escolha antiga
  // deixaria o `<select>` mostrando a primeira opção enquanto o React ainda
  // acharia que vale a anterior, o botão gravaria coisa diferente do que a
  // tela mostra. Descartar o que saiu da lista resolve na origem.
  const [escolhido, setEscolhido] = useState<StatusSolicitacao | null>(null)
  const status = escolhido && opcoes.includes(escolhido) ? escolhido : padrao

  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  if (!status) return null

  const precisaDeMotivo = exigeMotivo(status)

  function enviar() {
    setErro(null)
    iniciar(async () => {
      const resposta = await alterarStatus({
        solicitacaoId,
        statusNovo: status,
        motivo: motivo.trim() || undefined,
      })
      if (!resposta.ok) {
        setErro(resposta.erro)
        return
      }
      setMotivo('')
      setEscolhido(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {explicacaoDoAtalho ? (
        <p className="bg-muted/50 text-muted-foreground rounded-md border px-3 py-2 text-xs leading-relaxed">
          {explicacaoDoAtalho}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="status-novo">Novo status</Label>
        <Select
          id="status-novo"
          value={status}
          onChange={(e) => {
            setEscolhido(e.target.value as StatusSolicitacao)
            setErro(null)
          }}
        >
          {opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULO_STATUS[opcao]}
              {opcao === sugerido ? ' (sugerido)' : ''}
            </option>
          ))}
        </Select>
      </div>

      {precisaDeMotivo ? (
        <div className="space-y-1.5">
          <Label htmlFor="motivo-status">Motivo</Label>
          <Textarea
            id="motivo-status"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Fica gravado no histórico, junto com quem mudou e quando."
          />
        </div>
      ) : null}

      {erro ? (
        <p role="alert" className="text-destructive text-sm">
          {erro}
        </p>
      ) : null}

      <Button
        onClick={enviar}
        disabled={salvando || (precisaDeMotivo && !motivo.trim())}
        // Alguns rótulos são longos ("Entregue / rastreio finalizado") e o
        // botão do DS não quebra linha: sem isto o texto vaza do cartão.
        className="h-auto w-full py-2.5 leading-snug whitespace-normal"
      >
        {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {salvando ? 'Gravando…' : `Mudar para ${ROTULO_STATUS[status]}`}
      </Button>
    </div>
  )
}
