import mysql from 'mysql2/promise'

let pool: mysql.Pool | undefined

export function db() {
  if (!pool) {
    const c = useRuntimeConfig()
    pool = mysql.createPool({ host: c.dbHost, port: c.dbPort, database: c.dbName, user: c.dbUser, password: c.dbPassword, waitForConnections: true, connectionLimit: 10, charset: 'utf8mb4' })
  }
  return pool
}
