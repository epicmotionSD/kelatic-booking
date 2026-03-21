// DEBUG ONLY — remove after diagnosing MySQL connectivity
import { NextRequest, NextResponse } from 'next/server'
import { queryBluehost } from '@/lib/mysql/bluehost'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await queryBluehost('SELECT 1 AS ok')
    return NextResponse.json({
      connected: true,
      host: process.env.BLUEHOST_MYSQL_HOST,
      user: process.env.BLUEHOST_MYSQL_USER,
      database: process.env.BLUEHOST_MYSQL_DATABASE,
      rows,
    })
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException & { code?: string; sqlMessage?: string }
    return NextResponse.json({
      connected: false,
      host: process.env.BLUEHOST_MYSQL_HOST,
      user: process.env.BLUEHOST_MYSQL_USER,
      error: e.message,
      code: e.code,
      sqlMessage: e.sqlMessage,
    })
  }
}
