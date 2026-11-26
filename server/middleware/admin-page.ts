import { createHash, timingSafeEqual } from 'node:crypto'

const hash = (value: string) => createHash('sha256').update(value).digest()

// Halaman admin memakai login khusus. API admin tetap ditutup oleh requireAdmin.
export default defineEventHandler((event) => {
  if (!/^\/admin(\/|\?|$)/i.test(event.path)) return
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env
  if (!ADMIN_USER || !ADMIN_PASSWORD) return
  const token = parseCookies(event).mas_vedo_admin
  const valid = typeof token === 'string' && timingSafeEqual(hash(token), hash(`${ADMIN_USER}:${ADMIN_PASSWORD}`))
  if (!valid) {
    return sendRedirect(event, '/login?next=/admin', 302)
  }
})
