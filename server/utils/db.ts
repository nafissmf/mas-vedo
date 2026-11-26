import mysql from 'mysql2/promise'

let pool: mysql.Pool | undefined

export function db() {
  if (!pool) {
    // Dibaca saat runtime agar nilai dari .env / docker compose dipakai, bukan nilai saat build
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env
    pool = mysql.createPool({ host: DB_HOST, port: Number(DB_PORT || 3306), database: DB_NAME, user: DB_USER, password: DB_PASSWORD, waitForConnections: true, connectionLimit: 10, charset: 'utf8mb4' })
  }
  return pool
}
