import { db } from '~/server/utils/db'

// Membuat tabel dari database/init.sql saat aplikasi start. Aman diulang (CREATE TABLE IF NOT EXISTS).
export default defineNitroPlugin(() => {
  if (import.meta.prerender) return

  const init = async (attempt = 1): Promise<void> => {
    try {
      const sql = String(await useStorage('assets:database').getItem('init.sql') ?? '')
      const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
      if (!statements.length) throw new Error('database/init.sql tidak ditemukan atau kosong')
      for (const statement of statements) await db().query(statement)
      console.log('[init-db] Tabel database siap.')
    } catch (error) {
      console.error(`[init-db] Gagal (percobaan ${attempt}/10):`, (error as Error).message)
      if (attempt < 10) setTimeout(() => init(attempt + 1), 5000)
    }
  }
  void init()
})
