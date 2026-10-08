import { z } from 'zod'
import { SituacaoOperacional } from '@prisma/client'
import { semanasNoAno } from '@/lib/periodo'
import { emailOpcional } from './comuns'

/**
 * Formulários do módulo de Logística: status da semana, equipe e FAQ.
 */

/** Campo ausente ou em branco é nulo, e não string vazia. */
const vazioViraNulo = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? null : v

const inteiro = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v))

export const statusDaSemanaSchema = z
  .object({
    ano: z.preprocess(inteiro, z.number().int().min(2000).max(2100)),
    semana: z.preprocess(
      inteiro,
      z.number().int().min(1, 'Semana inválida.').max(53, 'Semana inválida.'),
    ),
    /** `automatico` devolve a semana para a sugestão dos números. */
    situacao: z
      .union([z.nativeEnum(SituacaoOperacional), z.literal('automatico')])
      .transform((v) => (v === 'automatico' ? null : v)),
    observacao: z.preprocess(
      vazioViraNulo,
      z.string().trim().max(280, 'Use até 280 caracteres.').nullable(),
    ),
  })
  // A semana 53 só existe em alguns anos; 2025 tem 52.
  .refine((d) => d.semana <= semanasNoAno(d.ano), { message: 'Semana inválida.', path: ['semana'] })

export const membroSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.').max(80),
  funcao: z.string().trim().min(2, 'Informe a função.').max(80),
  descricao: z.preprocess(
    vazioViraNulo,
    z.string().trim().max(400, 'Use até 400 caracteres.').nullable(),
  ),
  email: emailOpcional,
  ordem: z.preprocess(inteiro, z.number().int().min(0).max(999).default(0)),
})

export const perguntaSchema = z.object({
  pergunta: z.string().trim().min(5, 'Escreva a pergunta.').max(200, 'Use até 200 caracteres.'),
  resposta: z.string().trim().min(2, 'Escreva a resposta.').max(4000),
  ordem: z.preprocess(inteiro, z.number().int().min(0).max(999).default(0)),
})
