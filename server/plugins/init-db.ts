import { db } from '~/server/utils/db'

type SeedResponse = { code: string, n: string, u: string, p: string, y: string, t: string, a: number[] }

// Membuat tabel dari database/init.sql saat aplikasi start. Aman diulang (CREATE TABLE IF NOT EXISTS).
export default defineNitroPlugin(() => {
  if (import.meta.prerender) return

  const init = async (attempt = 1): Promise<void> => {
    try {
      const sql = String(await useStorage('assets:database').getItem('init.sql') ?? '')
      const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
      if (!statements.length) throw new Error('database/init.sql tidak ditemukan atau kosong')
      for (const statement of statements) await db().query(statement)
      const [[count]] = await db().query<any[]>('SELECT COUNT(*) AS total FROM responses')
      if (Number(count.total) === 0) {
        const seed = await useStorage('assets:database').getItem('seed-data.json') as SeedResponse[] | null
        if (Array.isArray(seed) && seed.length) {
          const connection = await db().getConnection()
          try {
            await connection.beginTransaction()
            for (const response of seed) {
              const [result] = await connection.execute<any>('INSERT INTO responses (respondent_code, name, work_unit, position, years_of_service, submitted_at) VALUES (?, ?, ?, ?, ?, ?)', [response.code, response.n, response.u, response.p, response.y, response.t])
              const variables = [...Array(8).fill('X1'), ...Array(6).fill('X2'), ...Array(8).fill('Z'), ...Array(8).fill('Y')]
              await connection.query('INSERT INTO answers (response_id, question_key, variable_code, score) VALUES ?', [response.a.map((score, index) => [result.insertId, `Q${String(index + 1).padStart(2, '0')}`, variables[index], score])])
            }
            await connection.commit()
            console.log(`[init-db] ${seed.length} data seed dimasukkan.`)
          } catch (seedError) {
            await connection.rollback()
            throw seedError
          } finally { connection.release() }
        }
      }
      console.log('[init-db] Tabel database siap.')
    } catch (error) {
      console.error(`[init-db] Gagal (percobaan ${attempt}/10):`, (error as Error).message)
      if (attempt < 10) setTimeout(() => init(attempt + 1), 5000)
    }
  }
  void init()
})
