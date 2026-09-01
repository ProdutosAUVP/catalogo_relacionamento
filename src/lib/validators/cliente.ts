import { z } from 'zod'
import { cpfSchema, emailOpcional, telefoneOpcional, textoOpcional } from './comuns'

export const clienteSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome do cliente.').max(200),
  cpf: cpfSchema,
  telefone: telefoneOpcional,
  email: emailOpcional,
  salesforceId: textoOpcional,
})

export type ClienteInput = z.input<typeof clienteSchema>

/**
 * Linha do CSV de importação de clientes.
 *
 * A importação é um atalho, não uma integração: o arquivo pode vir de planilha
 * feita à mão, então os cabeçalhos são normalizados antes de chegar aqui.
 */
export const linhaImportacaoClienteSchema = z.object({
  nome: z.string().trim().min(2),
  cpf: cpfSchema,
  telefone: telefoneOpcional,
  email: emailOpcional,
})

export type LinhaImportacaoCliente = z.output<typeof linhaImportacaoClienteSchema>
