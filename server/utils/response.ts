import { randomUUID } from 'node:crypto'
import type { ResultSetHeader } from 'mysql2'
import type { PoolConnection } from 'mysql2/promise'
import { questions } from '~/shared/questions'
import { db } from '~/server/utils/db'

const limits = { name: 150, workUnit: 150, position: 150, yearsOfService: 100 } as const

export function parsePayload(body: any) {
  const profile = {} as Record<keyof typeof limits, string>
  for (const [field, max] of Object.entries(limits) as [keyof typeof limits, number][]) {
    const value = typeof body?.[field] === 'string' ? body[field].trim() : ''
    if (!value) throw createError({ statusCode: 400, statusMessage: 'Data responden belum lengkap.' })
    if (value.length > max) throw createError({ statusCode: 400, statusMessage: 'Data responden terlalu panjang.' })
    profile[field] = value
  }
  const answers = body?.answers
  const invalid = questions.some((q) => !Number.isInteger(answers?.[q.key]) || answers[q.key] < 1 || answers[q.key] > 5)
  if (invalid) throw createError({ statusCode: 400, statusMessage: 'Seluruh pernyataan wajib diberi nilai 1–5.' })
  return { ...profile, answers: answers as Record<string, number> }
}

export function responseId(value: string | undefined) {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: 'ID tidak valid.' })
  return id
}

export async function insertAnswers(connection: PoolConnection, id: number, answers: Record<string, number>) {
  const rows = questions.map((q) => [id, q.key, q.variableCode, answers[q.key]])
  await connection.query('INSERT INTO answers (response_id, question_key, variable_code, score) VALUES ?', [rows])
}

export async function transaction<T>(work: (connection: PoolConnection) => Promise<T>) {
  const connection = await db().getConnection()
  try {
    await connection.beginTransaction()
    const result = await work(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally { connection.release() }
}

export async function createResponse(body: unknown) {
  const data = parsePayload(body)
  return transaction(async (connection) => {
    const code = randomUUID()
    const [result] = await connection.execute<ResultSetHeader>('INSERT INTO responses (respondent_code, name, work_unit, position, years_of_service) VALUES (?, ?, ?, ?, ?)', [code, data.name, data.workUnit, data.position, data.yearsOfService])
    await insertAnswers(connection, result.insertId, data.answers)
    return { id: result.insertId, respondentCode: code }
  })
}
