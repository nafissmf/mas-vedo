import { createHash, timingSafeEqual } from 'node:crypto'

const hash = (value: string) => createHash('sha256').update(value).digest()

export default defineEventHandler(async (event) => {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    throw createError({ statusCode: 503, statusMessage: 'Konfigurasi login belum tersedia.' })
  }

  const body = await readBody<{ username?: string; password?: string }>(event)
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const usernameValid = timingSafeEqual(hash(username), hash(ADMIN_USER))
  const passwordValid = timingSafeEqual(hash(password), hash(ADMIN_PASSWORD))

  if (!usernameValid || !passwordValid) {
    throw createError({ statusCode: 401, statusMessage: 'Nama pengguna atau kata sandi salah.' })
  }

  setCookie(event, 'mas_vedo_admin', `${ADMIN_USER}:${ADMIN_PASSWORD}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  })

  return { ok: true }
})
