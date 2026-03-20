import { NextRequest, NextResponse } from 'next/server'
import { queryBluehost } from '@/lib/mysql/bluehost'

// Format a JS Date to MySQL datetime string: "YYYY-MM-DD HH:MM:SS"
function toMySQLDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

export async function POST(request: NextRequest) {
  try {
    const { stylist_email, start_time, end_time } = await request.json()

    if (!stylist_email || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: stylist_email, start_time, end_time' },
        { status: 400 }
      )
    }

    const startDt = toMySQLDatetime(new Date(start_time))
    const endDt   = toMySQLDatetime(new Date(end_time))

    // 1. Look up the Amelia provider ID by stylist email
    const users = await queryBluehost<{ id: number }>(
      `SELECT id FROM gzf_amelia_users
       WHERE email = ? AND type = 'provider'
       LIMIT 1`,
      [stylist_email]
    )

    if (!users.length) {
      // Stylist not in Amelia system — no cross-system conflict possible
      return NextResponse.json({ conflict: false, source: 'amelia_not_found' })
    }

    const providerId = users[0].id

    // 2. Check for any active overlapping appointment
    const conflicts = await queryBluehost<{
      id: number
      bookingStart: string
      bookingEnd: string
      serviceName: string
    }>(`
      SELECT
        a.id,
        a.bookingStart,
        a.bookingEnd,
        s.name AS serviceName
      FROM gzf_amelia_appointments a
      LEFT JOIN gzf_amelia_services s ON a.serviceId = s.id
      WHERE a.providerId = ?
        AND a.status NOT IN ('canceled', 'rejected', 'no-show')
        AND a.bookingStart < ?
        AND a.bookingEnd   > ?
      LIMIT 1
    `, [providerId, endDt, startDt])

    if (conflicts.length) {
      const existing = conflicts[0]
      return NextResponse.json({
        conflict: true,
        source: 'amelia',
        existing: {
          id:      existing.id,
          start:   existing.bookingStart,
          end:     existing.bookingEnd,
          service: existing.serviceName,
        },
        message: `Stylist already has an Amelia booking (appt #${existing.id}) from ${existing.bookingStart} to ${existing.bookingEnd}`,
      })
    }

    return NextResponse.json({ conflict: false })
  } catch (error) {
    console.error('[CheckConflicts] Error:', error)
    return NextResponse.json({ error: 'Conflict check failed' }, { status: 500 })
  }
}
