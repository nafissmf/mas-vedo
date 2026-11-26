import { requireAdmin } from '~/server/utils/admin-auth'
import type { RowDataPacket } from 'mysql2'
import { db } from '~/server/utils/db'
import { responseId } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = responseId(getRouterParam(event, 'id'))
  const [rows] = await db().query<RowDataPacket[]>('SELECT id, name, work_unit AS workUnit, position, years_of_service AS yearsOfService, submitted_at AS submittedAt FROM responses WHERE id = ?', [id])
  if (!rows[0]) throw createError({ statusCode: 404, statusMessage: 'Data tidak ditemukan.' })
  const [answers] = await db().query<RowDataPacket[]>('SELECT question_key, score FROM answers WHERE response_id = ?', [id])
  return { ...rows[0], answers: Object.fromEntries(answers.map((a) => [a.question_key, a.score])) as Record<string, number> }
})
