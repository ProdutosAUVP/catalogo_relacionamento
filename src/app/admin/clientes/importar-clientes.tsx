'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialogo } from '@/components/ui/dialogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { importarClientes } from '@/lib/actions/clientes'
import type { ResumoDaImportacao } from '@/lib/importacao-clientes'

/**
 * Importação de clientes por CSV.
 *
 * O arquivo costuma ser um "salvar como CSV" de planilha feita à mão, então o
 * resultado é tão importante quanto a importação: quantos entraram, quantos
 * foram atualizados e **quais linhas ficaram de fora, com o motivo**. Uma
 * importação que só diz "pronto" obriga a conferir a base inteira depois.
 */
export function ImportarClientes() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [resumo, setResumo] = useState<ResumoDaImportacao | null>(null)

  /**
   * `onSubmit`, e não `action`: React limparia o campo de arquivo junto, e o
   * resumo apareceria ao lado de um formulário vazio — como se nada tivesse
   * sido enviado.
   */
  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    setErro(null)
    setResumo(null)
    iniciar(async () => {
      const r = await importarClientes(dados)
      if (!r.ok) return setErro(r.erro)
      setResumo(r.dados)
      router.refresh()
    })
  }

  function fechar() {
    setAberto(false)
    setResumo(null)
    setErro(null)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        <Upload aria-hidden="true" />
        Importar CSV
      </Button>

      <Dialogo
        aberto={aberto}
        aoFechar={fechar}
        titulo="Importar clientes"
        descricao="CPF que já existe atualiza o cadastro, não cria um segundo."
      >
        <form onSubmit={enviar} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="arquivo-csv">Arquivo CSV</Label>
            <Input
              id="arquivo-csv"
              name="arquivo"
              type="file"
              accept=".csv,text/csv"
              required
              className="file:bg-muted h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
            />
          </div>

          <div className="bg-muted/40 text-muted-foreground rounded-lg border p-4 text-xs leading-relaxed">
            <p className="text-foreground font-medium">Colunas</p>
            <p className="mt-1">
              <code>nome</code> e <code>cpf</code> são obrigatórias; <code>telefone</code> e{' '}
              <code>email</code> entram se existirem. Acento e caixa no cabeçalho não importam, e
              sinônimos comuns são aceitos (“nome completo”, “documento”, “celular”, “e-mail”).
            </p>
            <p className="mt-2">
              Separador <code>;</code> ou <code>,</code> — o do Excel pt-BR e o do Sheets. Campo
              vazio na planilha mantém o que já está no cadastro.
            </p>
          </div>

          {erro ? (
            <p role="alert" className="text-destructive text-sm">
              {erro}
            </p>
          ) : null}

          {resumo ? (
            <div className="space-y-3">
              <div className="border-success/30 bg-success/10 rounded-lg border p-4 text-sm">
                <p className="font-medium">
                  {resumo.novas} {resumo.novas === 1 ? 'cliente novo' : 'clientes novos'} ·{' '}
                  {resumo.atualizadas} {resumo.atualizadas === 1 ? 'atualizado' : 'atualizados'}
                </p>
                <p className="text-muted-foreground mt-1">
                  {resumo.total} {resumo.total === 1 ? 'linha lida' : 'linhas lidas'} no arquivo.
                </p>
              </div>

              {resumo.erros.length > 0 ? (
                <div className="border-error/30 bg-error/10 rounded-lg border p-4 text-sm">
                  <p className="font-medium">
                    {resumo.erros.length}{' '}
                    {resumo.erros.length === 1 ? 'linha ficou de fora' : 'linhas ficaram de fora'}
                  </p>
                  <ul className="text-muted-foreground mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                    {resumo.erros.map((e, i) => (
                      <li key={i}>
                        {e.linha > 0 ? <strong>Linha {e.linha}: </strong> : null}
                        {e.motivo}
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Corrija na planilha e importe de novo — o que já entrou não duplica.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={fechar}>
              {resumo ? 'Fechar' : 'Cancelar'}
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {enviando ? 'Importando…' : 'Importar'}
            </Button>
          </div>
        </form>
      </Dialogo>
    </>
  )
}
