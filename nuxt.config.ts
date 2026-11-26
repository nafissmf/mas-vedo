import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/main.css'],
  // Ikutkan folder database ke hasil build agar init.sql bisa dibaca di production.
  nitro: { serverAssets: [{ baseName: 'database', dir: fileURLToPath(new URL('./database', import.meta.url)) }] },
  typescript: { strict: true }
})
