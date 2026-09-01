import { z } from 'zod'
import { TipoValor } from '@prisma/client'
import { inteiroOpcional, textoOpcional, urlOpcional, valorSchema } from './comuns'

/**
 * O CRUD de catálogo é operado pela própria área de Relacionamento, sem apoio
 * técnico. As mensagens de erro são escritas para essa leitora.
 */

export const produtoSchema = z
  .object({
    nome: z.string().trim().min(2, 'Informe o nome do produto.').max(200),
    descricao: textoOpcional,
    categoriaId: z.string().min(1, 'Escolha uma categoria.'),
    fotoUrl: urlOpcional,
    valor: valorSchema,
    tipoValor: z.nativeEnum(TipoValor).default(TipoValor.exato),
    controlaEstoque: z.boolean().default(false),
    estoque: inteiroOpcional,
    ativo: z.boolean().default(true),
    skuTiny: textoOpcional,
  })
  .refine((d) => !d.controlaEstoque || d.estoque !== null, {
    message: 'Produto que controla estoque precisa da quantidade em estoque.',
    path: ['estoque'],
  })

export type ProdutoInput = z.input<typeof produtoSchema>
export type ProdutoValidado = z.output<typeof produtoSchema>

export const categoriaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da categoria.').max(100),
  ativo: z.boolean().default(true),
})
