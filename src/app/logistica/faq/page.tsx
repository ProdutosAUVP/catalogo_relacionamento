import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditorDePergunta } from './editor-de-pergunta'

/**
 * Perguntas frequentes da Logística (relatório, item 7).
 *
 * O conteúdo está sendo escrito pela área; o espaço existe desde já, e quem
 * o preenche é a própria Logística, sem passar por desenvolvimento.
 */
export default async function FaqPage() {
  const usuario = await exigirPermissao('logistica.ver')
  const podeGerenciar = pode(usuario.perfil, 'logistica.gerenciar')

  const perguntas = await db.perguntaFrequente.findMany({
    where: podeGerenciar ? {} : { ativo: true },
    orderBy: [{ ativo: 'desc' }, { ordem: 'asc' }, { criadoEm: 'asc' }],
  })

  return (
    <>
      <CabecalhoDaPagina
        titulo="Perguntas frequentes"
        descricao="As dúvidas que mais chegam à Logística, respondidas pelo próprio time."
        acoes={
          <>
            <Button variant="outline" asChild>
              <Link href="/logistica">
                <ArrowLeft aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
            {podeGerenciar ? <EditorDePergunta /> : null}
          </>
        }
      />

      {perguntas.length === 0 ? (
        <EstadoVazio
          titulo="Em elaboração"
          descricao="A equipe de Logística está reunindo as perguntas e respostas mais comuns. Enquanto isso, as dúvidas sobre um envio vão na própria tarefa do ClickUp."
        />
      ) : (
        <div className="bg-card divide-y rounded-lg border">
          {perguntas.map((p) => (
            <details key={p.id} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="font-medium">
                  {p.pergunta}
                  {p.ativo ? null : (
                    <Badge variant="muted" className="ml-2 align-middle">
                      fora do ar
                    </Badge>
                  )}
                </span>
                <ChevronDown
                  className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                {p.resposta}
              </p>
              {podeGerenciar ? (
                <div className="mt-3 flex justify-end">
                  <EditorDePergunta pergunta={p} />
                </div>
              ) : null}
            </details>
          ))}
        </div>
      )}
    </>
  )
}
