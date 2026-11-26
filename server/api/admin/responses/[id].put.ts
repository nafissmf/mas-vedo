import { requireAdmin } from '~/server/utils/admin-auth'
import type { RowDataPacket } from 'mysql2'
import { insertAnswers, parsePayload, responseId, transaction } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = responseId(getRouterParam(event, 'id'))
  const data = parsePayload(await readBody(event))
  await transaction(async (connection) => {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT id FROM responses WHERE id = ? FOR UPDATE', [id])
    if (!rows[0]) throw createError({ statusCode: 404, statusMessage: 'Data tidak ditemukan.' })
    await connection.execute('UPDATE responses SET name = ?, work_unit = ?, position = ?, years_of_service = ? WHERE id = ?', [data.name, data.workUnit, data.position, data.yearsOfService, id])
    await connection.execute('DELETE FROM answers WHERE response_id = ?', [id])
    await insertAnswers(connection, id, data.answers)
  })
  return { ok: true }
})
