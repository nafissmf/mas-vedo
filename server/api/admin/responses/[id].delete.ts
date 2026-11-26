import { requireAdmin } from '~/server/utils/admin-auth'
import type { ResultSetHeader } from 'mysql2'
import { db } from '~/server/utils/db'
import { responseId } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  // Jawaban ikut terhapus lewat ON DELETE CASCADE.
  const [result] = await db().execute<ResultSetHeader>('DELETE FROM responses WHERE id = ?', [responseId(getRouterParam(event, 'id'))])
  if (!result.affectedRows) throw createError({ statusCode: 404, statusMessage: 'Data tidak ditemukan.' })
  return { ok: true }
})
