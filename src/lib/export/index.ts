export { COLUNAS, linhasParaExportar, type LinhaExport, type ColunaExport } from './linhas'
export { gerarCsv, escaparCampo } from './csv'
export { gerarXlsx } from './xlsx'

/** Nome do arquivo exportado, com a data para não sobrescrever downloads. */
export function nomeDoArquivo(formato: 'csv' | 'xlsx', referencia = new Date()): string {
  const data = referencia.toISOString().slice(0, 10)
  return `solicitacoes-${data}.${formato}`
}
