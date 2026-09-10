'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TipoValor } from '@prisma/client'
import { Loader2, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialogo } from '@/components/ui/dialogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ProdutoImagem } from '@/components/produto-imagem'
import { salvarProduto, alternarProduto } from '@/lib/actions/catalogo'

/**
 * Cadastro e edição de produto.
 *
 * O formulário é `FormData` cru, e não estado controlado campo a campo: o
 * upload da foto vai no mesmo envio, e a validação de verdade acontece no
 * servidor, em `produtoSchema`. Espelhar tudo em `useState` só duplicaria a
 * regra num lugar onde ela não deve morar.
 */

export type ProdutoEditavel = {
  id: string
  nome: string
  descricao: string | null
  categoriaId: string
  fotoUrl: string | null
  valor: string
  tipoValor: TipoValor
  controlaEstoque: boolean
  estoque: number | null
  ativo: boolean
  skuTiny: string | null
}

export type CategoriaOpcao = { id: string; nome: string; ativo: boolean }

export function EditorDeProduto({
  produto,
  categorias,
}: {
  produto?: ProdutoEditavel
  categorias: CategoriaOpcao[]
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [salvando, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [controlaEstoque, setControlaEstoque] = useState(produto?.controlaEstoque ?? false)
  const [previa, setPrevia] = useState<string | null>(null)

  const editando = Boolean(produto)
  const disponiveis = categorias.filter((c) => c.ativo || c.id === produto?.categoriaId)

  function abrir() {
    setErro(null)
    setPrevia(null)
    setControlaEstoque(produto?.controlaEstoque ?? false)
    setAberto(true)
  }

  /**
   * `onSubmit`, e não `action`: React limpa um formulário não controlado depois
   * de rodar a action, e uma recusa do servidor apagaria tudo o que a pessoa
   * digitou — inclusive o arquivo escolhido, que ela teria de buscar de novo.
   */
  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    setErro(null)
    iniciar(async () => {
      const r = await salvarProduto(dados)
      if (!r.ok) return setErro(r.erro)
      setAberto(false)
      router.refresh()
    })
  }

  return (
    <>
      {editando ? (
        <Button variant="ghost" size="sm" onClick={abrir}>
          <Pencil aria-hidden="true" />
          Editar
        </Button>
      ) : (
        <Button onClick={abrir}>
          <Plus aria-hidden="true" />
          Novo produto
        </Button>
      )}

      <Dialogo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={editando ? 'Editar produto' : 'Novo produto'}
        descricao={
          editando
            ? 'Reajuste de preço não mexe em solicitação já feita: o valor de cada item congelou na criação.'
            : 'O produto entra ativo e aparece no catálogo do consultor na hora.'
        }
      >
        <form onSubmit={enviar} className="space-y-5">
          {produto ? <input type="hidden" name="id" value={produto.id} /> : null}

          <div className="space-y-1.5">
            <Label htmlFor="produto-nome">Nome</Label>
            <Input
              id="produto-nome"
              name="nome"
              required
              defaultValue={produto?.nome}
              placeholder="Caneca AUVP"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="produto-descricao">Descrição</Label>
            <Textarea
              id="produto-descricao"
              name="descricao"
              rows={2}
              defaultValue={produto?.descricao ?? ''}
              placeholder="O que é, material, tamanho — o que ajuda o consultor a escolher."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="produto-categoria">Categoria</Label>
              <Select
                id="produto-categoria"
                name="categoriaId"
                required
                defaultValue={produto?.categoriaId}
              >
                <option value="">Escolha…</option>
                {disponiveis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="produto-sku">SKU no Tiny</Label>
              <Input
                id="produto-sku"
                name="skuTiny"
                defaultValue={produto?.skuTiny ?? ''}
                placeholder="Opcional — usado na fase 2"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="produto-valor">Valor</Label>
              <Input
                id="produto-valor"
                name="valor"
                required
                inputMode="decimal"
                defaultValue={produto?.valor}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="produto-tipo-valor">Tipo do valor</Label>
              <Select
                id="produto-tipo-valor"
                name="tipoValor"
                defaultValue={produto?.tipoValor ?? TipoValor.exato}
              >
                <option value={TipoValor.exato}>Exato — preço fechado</option>
                <option value={TipoValor.medio}>Médio — exibido como “a partir de”</option>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                name="controlaEstoque"
                checked={controlaEstoque}
                onChange={(e) => setControlaEstoque(e.target.checked)}
                className="accent-primary size-4"
              />
              Controlar estoque deste produto
            </label>

            {controlaEstoque ? (
              <div className="space-y-1.5">
                <Label htmlFor="produto-estoque">Quantidade em estoque</Label>
                <Input
                  id="produto-estoque"
                  name="estoque"
                  type="number"
                  min={0}
                  required
                  defaultValue={produto?.estoque ?? 0}
                  className="max-w-40"
                />
                <p className="text-muted-foreground text-xs">
                  É o que decide se a solicitação passa pelo Financeiro: com saldo suficiente, a
                  aprovação já libera o envio.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Sem controle de estoque, a tela omite disponibilidade em vez de mostrar zero — e a
                solicitação sempre passa pelo Financeiro.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="produto-foto">Foto</Label>
            <div className="flex items-start gap-4">
              {/* Mesma proporção do catálogo: o que se vê aqui é o que aparece lá. */}
              <div className="w-24 shrink-0 overflow-hidden rounded-lg border">
                <ProdutoImagem
                  fotoUrl={previa ?? produto?.fotoUrl ?? null}
                  nome={produto?.nome ?? 'Novo produto'}
                  categoria=""
                  className="aspect-3/4"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  id="produto-foto"
                  name="foto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="file:bg-muted h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0]
                    setPrevia(arquivo ? URL.createObjectURL(arquivo) : null)
                  }}
                />
                <input type="hidden" name="fotoUrl" value={produto?.fotoUrl ?? ''} />
                <p className="text-muted-foreground text-xs">
                  JPEG, PNG, WebP ou AVIF, até 5 MB. Sem foto, o catálogo desenha uma ilustração da
                  categoria — nunca um espaço vazio.
                </p>
              </div>
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

/**
 * Ativa e desativa.
 *
 * É o que existe no lugar de excluir: produto some do catálogo do consultor e
 * continua nas solicitações que já o usaram.
 */
export function BotaoAtivar({ id, ativo }: { id: string; ativo: boolean }) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={salvando}
      onClick={() =>
        iniciar(async () => {
          await alternarProduto(id, !ativo)
          router.refresh()
        })
      }
    >
      {salvando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {ativo ? 'Desativar' : 'Reativar'}
    </Button>
  )
}
