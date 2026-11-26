import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const hash = (value: string) => createHash('sha256').update(value).digest()
const cookieName = 'mas_vedo_admin'

function validSession(event: H3Event) {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env
  if (!ADMIN_USER || !ADMIN_PASSWORD) return false
  const cookies = parseCookies(event)
  const token = cookies[cookieName]
  return typeof token === 'string' && timingSafeEqual(hash(token), hash(`${ADMIN_USER}:${ADMIN_PASSWORD}`))
}

// Basic Auth back office. Wajib dipanggil di setiap handler /api/admin.
export function requireAdmin(event: H3Event) {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env
  if (!ADMIN_USER || !ADMIN_PASSWORD) throw createError({ statusCode: 503, statusMessage: 'ADMIN_USER dan ADMIN_PASSWORD belum diatur.' })

  const [scheme, token] = (getRequestHeader(event, 'authorization') || '').split(' ')
  const given = scheme === 'Basic' && token ? Buffer.from(token, 'base64').toString('utf8') : ''
  const basicValid = timingSafeEqual(hash(given), hash(`${ADMIN_USER}:${ADMIN_PASSWORD}`))
  if (!basicValid && !validSession(event)) {
    setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="Back Office", charset="UTF-8"')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Cegah CSRF: situs lain tidak bisa mengirim application/json tanpa preflight.
  if (['POST', 'PUT'].includes(event.method) && !getRequestHeader(event, 'content-type')?.startsWith('application/json')) {
    throw createError({ statusCode: 415, statusMessage: 'Content-Type harus application/json.' })
  }
  setResponseHeader(event, 'Cache-Control', 'no-store')
}
