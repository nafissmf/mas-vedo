export default defineEventHandler((event) => {
  deleteCookie(event, 'mas_vedo_admin', { path: '/' })
  return { ok: true }
})
