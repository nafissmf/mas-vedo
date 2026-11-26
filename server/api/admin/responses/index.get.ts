import { requireAdmin } from '~/server/utils/admin-auth'
import type { RowDataPacket } from 'mysql2'
import { db } from '~/server/utils/db'

const perPage = 20

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const query = getQuery(event)
  const page = Math.max(1, Math.trunc(Number(query.page)) || 1)
  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`
  const where = search ? 'WHERE name LIKE ? OR work_unit LIKE ? OR position LIKE ?' : ''
  const params = search ? [like, like, like] : []

  const [count] = await db().query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM responses ${where}`, params)
  const [items] = await db().query<RowDataPacket[]>(`SELECT id, name, work_unit AS workUnit, position, years_of_service AS yearsOfService, submitted_at AS submittedAt FROM responses ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, perPage, (page - 1) * perPage])
  return { items, total: Number(count[0].total), page, perPage }
})
