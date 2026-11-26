import { PassThrough } from 'node:stream'
import archiverModule from 'archiver'
import type { RowDataPacket } from 'mysql2'
import { requireAdmin } from '~/server/utils/admin-auth'
import { db } from '~/server/utils/db'

const questionHeaders = [
  ...Array.from({ length: 8 }, (_, i) => `JI${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `OJ${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `CD${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `EP${i + 1}`)
]
const headers = ['No', 'Nama Lengkap', 'Jabatan', 'Unit Kerja', 'Masa Kerja', ...questionHeaders]
const escapeXml = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const columnName = (index: number) => {
  let result = ''
  for (let value = index + 1; value; value = Math.floor((value - 1) / 26)) result = String.fromCharCode(65 + ((value - 1) % 26)) + result
  return result
}
const textCell = (reference: string, value: unknown, style = 0) => `<c r="${reference}" s="${style}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
const numberCell = (reference: string, value: number, style = 3) => `<c r="${reference}" s="${style}"><v>${value}</v></c>`

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const [rows] = await db().query<RowDataPacket[]>(`
    SELECT r.id, r.name, r.position, r.work_unit AS workUnit, r.years_of_service AS yearsOfService,
           a.question_key AS questionKey, a.score
    FROM responses r LEFT JOIN answers a ON a.response_id = r.id
    ORDER BY r.id, a.question_key
  `)
  const records = new Map<number, { id: number, name: string, position: string, workUnit: string, yearsOfService: string, answers: Record<string, number> }>()
  for (const row of rows) {
    const id = Number(row.id)
    const record = records.get(id) || { id, name: row.name, position: row.position, workUnit: row.workUnit, yearsOfService: row.yearsOfService, answers: {} }
    if (row.questionKey) record.answers[row.questionKey] = Number(row.score)
    records.set(id, record)
  }

  const lastColumn = columnName(headers.length - 1)
  const title = 'INPUT DATA KUESIONER — EKSPOR SISTEM'
  const titleRow = `<row r="1" ht="26" customHeight="1">${textCell('A1', title, 1)}</row>`
  const headerRow = `<row r="2" ht="22" customHeight="1">${headers.map((header, index) => textCell(`${columnName(index)}2`, header, 2)).join('')}</row>`
  const dataRows = [...records.values()].map((record, rowIndex) => {
    const rowNumber = rowIndex + 3
    const values: unknown[] = [rowIndex + 1, record.name, record.position, record.workUnit, record.yearsOfService, ...Array.from({ length: 30 }, (_, index) => record.answers[`Q${String(index + 1).padStart(2, '0')}`] ?? '')]
    return `<row r="${rowNumber}">${values.map((value, index) => typeof value === 'number' ? numberCell(`${columnName(index)}${rowNumber}`, value) : textCell(`${columnName(index)}${rowNumber}`, value)).join('')}</row>`
  }).join('')
  const widths = headers.map((header, index) => `<col min="${index + 1}" max="${index + 1}" width="${index === 1 ? 31 : index === 2 || index === 3 ? 28 : index === 4 ? 17 : header.length <= 3 ? 9 : 14}" customWidth="1"/>`).join('')
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${titleRow}${headerRow}${dataRows}</sheetData><autoFilter ref="A2:${lastColumn}${records.size + 2}"/><mergeCells count="1"><mergeCell ref="A1:${lastColumn}1"/></mergeCells></worksheet>`
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs></styleSheet>`
  const archive = new archiverModule.ZipArchive({ zlib: { level: 9 } })
  const stream = new PassThrough()
  archive.on('error', (error: Error) => stream.destroy(error))
  archive.pipe(stream)
  archive.append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>', { name: '[Content_Types].xml' })
  archive.append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>', { name: '_rels/.rels' })
  archive.append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Input Data" sheetId="1" r:id="rId1"/></sheets></workbook>', { name: 'xl/workbook.xml' })
  archive.append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>', { name: 'xl/_rels/workbook.xml.rels' })
  archive.append(stylesXml, { name: 'xl/styles.xml' })
  archive.append(sheetXml, { name: 'xl/worksheets/sheet1.xml' })
  void archive.finalize()
  setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="input-data-kuesioner.xlsx"')
  return sendStream(event, stream)
})
