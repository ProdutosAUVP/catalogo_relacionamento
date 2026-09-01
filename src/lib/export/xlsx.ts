import ExcelJS from 'exceljs'
import { COLUNAS, type LinhaExport } from './linhas'

/**
 * Geração de XLSX.
 *
 * A diferença para o CSV não é cosmética: aqui os valores vão como número de
 * verdade, com formato de moeda, então quem recebe a planilha consegue somar,
 * filtrar e montar tabela dinâmica sem converter texto antes.
 */

const FORMATO_MOEDA = 'R$ #,##0.00'

export async function gerarXlsx(linhas: readonly LinhaExport[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Catálogo de Presentes'
  workbook.created = new Date()

  const aba = workbook.addWorksheet('Solicitações', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  aba.columns = COLUNAS.map((c) => ({
    header: c.titulo,
    key: c.chave,
    width: c.largura,
  }))

  const cabecalho = aba.getRow(1)
  cabecalho.font = { bold: true }
  cabecalho.alignment = { vertical: 'middle' }

  for (const linha of linhas) {
    aba.addRow(linha)
  }

  for (const [indice, coluna] of COLUNAS.entries()) {
    if (coluna.chave.startsWith('valor')) {
      aba.getColumn(indice + 1).numFmt = FORMATO_MOEDA
    }
  }

  // Autofiltro no cabeçalho: quem recebe o arquivo continua filtrando.
  if (linhas.length > 0) {
    aba.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUNAS.length } }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
