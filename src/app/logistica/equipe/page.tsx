import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EditorDeMembro } from './editor-de-membro'

/**
 * Apresentação da equipe de Logística (relatório, item 6).
 *
 * Quem cuida da página é o próprio time. Desativados só aparecem para quem
 * pode editar, apagados, para poderem ser reativados.
 */
export default async function EquipePage() {
  const usuario = await exigirPermissao('logistica.ver')
  const podeGerenciar = pode(usuario.perfil, 'logistica.gerenciar')

  const membros = await db.membroEquipe.findMany({
    where: podeGerenciar ? {} : { ativo: true },
    orderBy: [{ ativo: 'desc' }, { ordem: 'asc' }, { nome: 'asc' }],
  })

  return (
    <>
      <CabecalhoDaPagina
        titulo="Equipe de Logística"
        descricao="Quem recebe, separa, compra e envia. Para dúvidas sobre um envio, o caminho é a tarefa no ClickUp."
        acoes={
          <>
            <Button variant="outline" asChild>
              <Link href="/logistica">
                <ArrowLeft aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
            {podeGerenciar ? <EditorDeMembro /> : null}
          </>
        }
      />

      {membros.length === 0 ? (
        <EstadoVazio
          titulo="A equipe ainda não foi apresentada"
          descricao="A Logística cadastra aqui quem faz parte do time."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {membros.map((m) => (
            <li
              key={m.id}
              className={cn(
                'bg-card flex flex-col rounded-lg border p-5',
                !m.ativo && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-4">
                {m.fotoUrl ? (
                  // Foto servida atrás da sessão: o otimizador do Next não a alcançaria.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.fotoUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="bg-muted font-ui grid size-14 shrink-0 place-items-center rounded-full text-base font-semibold"
                    aria-hidden="true"
                  >
                    {m.nome
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]!.toUpperCase())
                      .join('')}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight font-semibold">{m.nome}</p>
                  <p className="text-muted-foreground text-sm">{m.funcao}</p>
                </div>
              </div>

              {m.descricao ? <p className="mt-4 text-sm leading-relaxed">{m.descricao}</p> : null}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                {m.email ? (
                  <a
                    href={`mailto:${m.email}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    {m.email}
                  </a>
                ) : (
                  <span />
                )}
                <span className="flex items-center gap-2">
                  {m.ativo ? null : <Badge variant="muted">desativado</Badge>}
                  {podeGerenciar ? <EditorDeMembro membro={m} /> : null}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
