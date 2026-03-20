import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.BLUEHOST_MYSQL_HOST,
      port: Number(process.env.BLUEHOST_MYSQL_PORT) || 3306,
      user: process.env.BLUEHOST_MYSQL_USER,
      password: process.env.BLUEHOST_MYSQL_PASSWORD,
      database: process.env.BLUEHOST_MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 3,
      queueLimit: 0,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 10000,
    })
  }
  return pool
}

export async function queryBluehost<T = Record<string, unknown>>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<T[]> {
  const p = getPool()
  const [rows] = await p.execute(sql, params)
  return rows as T[]
}
