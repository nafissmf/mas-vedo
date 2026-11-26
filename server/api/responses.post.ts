import { randomUUID } from 'node:crypto'
import type { ResultSetHeader } from 'mysql2'
import { questions } from '~/shared/questions'
import { db } from '~/server/utils/db'

type Payload = { name?: string; workUnit?: string; position?: string; yearsOfService?: string; answers?: Record<string, number> }
export default defineEventHandler(async (event) => {
  const body = await readBody<Payload>(event)
  const fields = ['name', 'workUnit', 'position', 'yearsOfService'] as const
  if (fields.some((field) => !body[field]?.trim()) || !body.answers) throw createError({ statusCode: 400, statusMessage: 'Data responden belum lengkap.' })
  const invalid = questions.some((q) => !Number.isInteger(body.answers![q.key]) || body.answers![q.key] < 1 || body.answers![q.key] > 5)
  if (invalid) throw createError({ statusCode: 400, statusMessage: 'Seluruh pernyataan wajib diberi nilai 1–5.' })
  const connection = await db().getConnection()
  try {
    await connection.beginTransaction()
    const code = randomUUID()
    const [result] = await connection.execute<ResultSetHeader>('INSERT INTO responses (respondent_code, name, work_unit, position, years_of_service) VALUES (?, ?, ?, ?, ?)', [code, body.name!.trim(), body.workUnit!.trim(), body.position!.trim(), body.yearsOfService!.trim()])
    const rows = questions.map((q) => [result.insertId, q.key, q.variableCode, body.answers![q.key]])
    await connection.query('INSERT INTO answers (response_id, question_key, variable_code, score) VALUES ?', [rows])
    await connection.commit()
    return { ok: true, respondentCode: code }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally { connection.release() }
})
