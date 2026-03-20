import { NextResponse } from 'next/server'
import { queryBluehost } from '@/lib/mysql/bluehost'

export interface AmeliaConflict {
  appt_1_id: number
  appt_2_id: number
  stylist: string
  service: string
  slot_1_start: string
  slot_1_end: string
  slot_2_start: string
  slot_2_end: string
}

export async function GET() {
  try {
    const conflicts = await queryBluehost<AmeliaConflict>(`
      SELECT
        a1.id                                    AS appt_1_id,
        a2.id                                    AS appt_2_id,
        CONCAT(u.firstName, ' ', u.lastName)     AS stylist,
        s.name                                   AS service,
        a1.bookingStart                          AS slot_1_start,
        a1.bookingEnd                            AS slot_1_end,
        a2.bookingStart                          AS slot_2_start,
        a2.bookingEnd                            AS slot_2_end
      FROM gzf_amelia_appointments a1
      JOIN gzf_amelia_appointments a2
        ON  a1.providerId   = a2.providerId
        AND a1.id           < a2.id
        AND a1.bookingStart < a2.bookingEnd
        AND a1.bookingEnd   > a2.bookingStart
        AND a1.status NOT IN ('canceled', 'rejected', 'no-show')
        AND a2.status NOT IN ('canceled', 'rejected', 'no-show')
      LEFT JOIN gzf_amelia_users    u ON a1.providerId = u.id
      LEFT JOIN gzf_amelia_services s ON a1.serviceId  = s.id
      ORDER BY u.firstName, a1.bookingStart
    `)

    return NextResponse.json({ conflicts, count: conflicts.length })
  } catch (error) {
    console.error('[Conflicts] MySQL error:', error)
    return NextResponse.json({ error: 'Failed to fetch conflicts' }, { status: 500 })
  }
}
