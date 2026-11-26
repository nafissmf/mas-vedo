export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/main.css'],
  runtimeConfig: {
    dbHost: process.env.DB_HOST || 'mysql-container',
    dbPort: Number(process.env.DB_PORT || 3306),
    dbName: process.env.DB_NAME || 'kuesioner_tesis',
    dbUser: process.env.DB_USER || 'kuesioner',
    dbPassword: process.env.DB_PASSWORD || 'kuesioner_rahasia'
  },
  typescript: { strict: true }
})
