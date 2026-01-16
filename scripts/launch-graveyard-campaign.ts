import fs from 'node:fs/promises'
import path from 'node:path'

interface SegmentedLeadPayload {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  source: string
  firstContact: string
  lastContact?: string
  segment: 'ghost' | 'near-miss' | 'vip'
  riskProfile: 'high' | 'medium' | 'low'
  estimatedValue: number
  daysSinceContact: number
  recommendedScript: 'direct-inquiry' | 'file-closure' | 'gift' | 'breakup'
}

interface ScriptArgs {
  file: string
  count: number
  businessId: string
  businessName: string
  service: string
  baseUrl: string
  delayHours: number
  dryRun: boolean
  segmentFilter: string
  estimatedValue: number
  token?: string
  outputFile?: string
}

function parseArgs(argv: string[]): ScriptArgs {
  const args = new Map<string, string>()
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i]
    if (value.startsWith('--')) {
      const key = value.replace(/^--/, '')
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) {
        args.set(key, 'true')
      } else {
        args.set(key, next)
        i += 1
      }
    }
  }

  const file = args.get('file') || 'launch_list_graveyard.csv'
  const count = Number(args.get('count') || '250')
  const businessId = args.get('businessId') || ''
  const businessName = args.get('businessName') || 'KeLatic Hair Lounge'
  const service = args.get('service') || 'your appointment'
  const baseUrl = args.get('baseUrl') || process.env.NEXT_PUBLIC_APP_URL || 'https://kelatic-booking.vercel.app'
  const delayHours = Number(args.get('delayHours') || '6')
  const dryRun = (args.get('dryRun') || 'false').toLowerCase() === 'true'
  const segmentFilter = (args.get('segmentFilter') || 'GRAVEYARD').toUpperCase()
  const estimatedValue = Number(args.get('estimatedValue') || '85')
  const token = args.get('token') || process.env.CRON_SECRET || undefined
  const outputFile = args.get('outputFile')

  return {
    file,
    count,
    businessId,
    businessName,
    service,
    baseUrl,
    delayHours,
    dryRun,
    segmentFilter,
    estimatedValue,
    token,
    outputFile,
  }
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(cell)
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1
      }
      row.push(cell)
      cell = ''
      if (row.length > 1 || row.some(value => value.trim().length > 0)) {
        rows.push(row)
      }
      row = []
      continue
    }

    cell += char
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase()
}

function toE164(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('+')) return trimmed
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

function toIsoFromDaysInactive(daysInactive: number): string {
  const ms = daysInactive * 24 * 60 * 60 * 1000
  return new Date(Date.now() - ms).toISOString()
}

async function loadLeads(args: ScriptArgs): Promise<SegmentedLeadPayload[]> {
  const csvPath = path.resolve(process.cwd(), args.file)
  const content = await fs.readFile(csvPath, 'utf8')
  const rows = parseCsv(content)

  if (rows.length === 0) {
    throw new Error(`No rows found in ${args.file}`)
  }

  const headers = rows[0].map(normalizeHeader)
  const headerIndex = new Map<string, number>()
  headers.forEach((header, index) => headerIndex.set(header, index))

  const getValue = (row: string[], key: string): string => {
    const idx = headerIndex.get(key)
    if (idx === undefined) return ''
    return (row[idx] || '').trim()
  }

  const seenPhones = new Set<string>()
  const leads: SegmentedLeadPayload[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const segmentRaw = getValue(row, 'segment').toUpperCase()
    if (segmentRaw && segmentRaw !== args.segmentFilter) {
      continue
    }

    const phoneRaw = getValue(row, 'clean_phone') || getValue(row, 'phone')
    const phone = toE164(phoneRaw)
    if (!phone) continue
    if (seenPhones.has(phone)) continue

    const daysInactive = Number(getValue(row, 'days_inactive') || '365')
    const firstContact = toIsoFromDaysInactive(daysInactive)

    const lead: SegmentedLeadPayload = {
      id: `csv_${i}`,
      firstName: getValue(row, 'firstname') || getValue(row, 'first_name') || 'there',
      lastName: getValue(row, 'lastname') || getValue(row, 'last_name') || '',
      email: getValue(row, 'email') || undefined,
      phone,
      source: 'graveyard',
      firstContact,
      lastContact: firstContact,
      segment: 'ghost',
      riskProfile: 'high',
      estimatedValue: args.estimatedValue,
      daysSinceContact: daysInactive,
      recommendedScript: 'direct-inquiry',
    }

    seenPhones.add(phone)
    leads.push(lead)

    if (leads.length >= args.count) {
      break
    }
  }

  return leads
}

async function waitForDelay(hours: number): Promise<void> {
  if (hours <= 0) return
  const ms = hours * 60 * 60 * 1000
  const target = new Date(Date.now() + ms)
  console.log(`[schedule] Waiting ${hours}h until ${target.toISOString()}`)
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function launchCampaign(args: ScriptArgs, leads: SegmentedLeadPayload[]): Promise<void> {
  const endpoint = new URL('/api/reactivation/launch', args.baseUrl).toString()

  const payload = {
    businessId: args.businessId,
    businessName: args.businessName,
    service: args.service,
    leads,
    segment: 'ghost',
    dryRun: args.dryRun,
  }

  if (args.outputFile) {
    const outputPath = path.resolve(process.cwd(), args.outputFile)
    await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8')
    console.log(`[output] Saved payload to ${outputPath}`)
  }

  console.log(`[launch] POST ${endpoint}`)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(args.token ? { Authorization: `Bearer ${args.token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Launch failed (${response.status}): ${text}`)
  }

  console.log(`[launch] Response: ${text}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.businessId) {
    throw new Error('Missing --businessId')
  }

  const leads = await loadLeads(args)
  if (leads.length === 0) {
    throw new Error('No leads found after filtering.')
  }

  console.log(`[leads] Loaded ${leads.length} leads from ${args.file}`)
  console.log(`[config] baseUrl=${args.baseUrl} dryRun=${args.dryRun} delayHours=${args.delayHours}`)

  await waitForDelay(args.delayHours)
  await launchCampaign(args, leads)
}

main().catch(error => {
  console.error('[error]', error instanceof Error ? error.message : error)
  process.exit(1)
})
