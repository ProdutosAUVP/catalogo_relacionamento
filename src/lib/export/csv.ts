import { COLUNAS, type LinhaExport } from './linhas'

/**
 * Geração de CSV.
 *
 * Duas decisões que evitam retrabalho com o Excel em português:
 *
 * - separador `;`, porque o Excel pt-BR usa vírgula como decimal e quebraria
 *   as colunas num CSV separado por vírgula;
 * - BOM UTF-8 no início, sem o qual o Excel exibe "José" como "JosÃ©".
 */

const SEPARADOR = ';'
const BOM = '﻿'

export function escaparCampo(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return ''

  const texto = String(valor)

  // Números saem com vírgula decimal para o Excel pt-BR reconhecer como número.
  if (typeof valor === 'number') {
    return texto.replace('.', ',')
  }

  const precisaAspas =
    texto.includes(SEPARADOR) || texto.includes('"') || texto.includes('\n') || texto.includes('\r')

  return precisaAspas ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function gerarCsv(linhas: readonly LinhaExport[]): string {
  const cabecalho = COLUNAS.map((c) => escaparCampo(c.titulo)).join(SEPARADOR)

  const corpo = linhas.map((linha) =>
    COLUNAS.map((c) => escaparCampo(linha[c.chave])).join(SEPARADOR),
  )

  return BOM + [cabecalho, ...corpo].join('\r\n')
}
