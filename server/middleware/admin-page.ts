import { requireAdmin } from '~/server/utils/admin-auth'

// Meminta login saat halaman /admin dibuka. Data tetap dijaga di tiap handler API.
export default defineEventHandler((event) => {
  if (/^\/admin(\/|\?|$)/i.test(event.path)) requireAdmin(event)
})
