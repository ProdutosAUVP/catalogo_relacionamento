'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialogo } from '@/components/ui/dialogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { salvarCategoria, alternarCategoria } from '@/lib/actions/catalogo'
import type { CategoriaOpcao } from './editor-de-produto'

/**
 * CRUD de categorias, num modal só.
 *
 * Categoria é lista curta e mexida de vez em quando; uma tela própria seria
 * mais navegação do que trabalho. Aqui também não se exclui: desativar mantém
 * legível o produto antigo que aponta para ela.
 */
export function EditorDeCategorias({ categorias }: { categorias: CategoriaOpcao[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [salvando, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [nome, setNome] = useState('')

  function criar() {
    setErro(null)
    const dados = new FormData()
    dados.set('nome', nome)
    iniciar(async () => {
      const r = await salvarCategoria(dados)
      if (!r.ok) return setErro(r.erro)
      setNome('')
      router.refresh()
    })
  }

  function alternar(id: string, ativo: boolean) {
    setErro(null)
    iniciar(async () => {
      const r = await alternarCategoria(id, ativo)
      if (!r.ok) return setErro(r.erro)
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        <Tags aria-hidden="true" />
        Categorias
      </Button>

      <Dialogo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Categorias"
        descricao="Agrupam o catálogo e definem a ilustração de quem não tem foto."
      >
        <div className="space-y-5">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="categoria-nome">Nova categoria</Label>
              <Input
                id="categoria-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    criar()
                  }
                }}
                placeholder="Ex.: Placas e troféus"
              />
            </div>
            <Button onClick={criar} disabled={salvando || nome.trim().length < 2}>
              {salvando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Adicionar
            </Button>
          </div>

          {erro ? (
            <p role="alert" className="text-destructive text-sm">
              {erro}
            </p>
          ) : null}

          <ul className="divide-y rounded-lg border">
            {categorias.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className={c.ativo ? 'text-sm' : 'text-muted-foreground text-sm'}>
                  {c.nome}
                </span>
                <span className="flex items-center gap-2">
                  {c.ativo ? null : <Badge variant="muted">desativada</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={salvando}
                    onClick={() => alternar(c.id, !c.ativo)}
                  >
                    {c.ativo ? 'Desativar' : 'Reativar'}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Dialogo>
    </>
  )
}
