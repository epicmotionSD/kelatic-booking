// =============================================================================
// TWILIO CAMPAIGN SMS SENDER
// Handles sending SMS for campaigns with per-tenant Twilio credentials
// =============================================================================

import twilio from 'twilio'

interface SendCampaignSMSParams {
  to: string
  from: string
  body: string
  accountSid: string
  authToken: string
  statusCallback?: string
}

interface TwilioSendResult {
  sid: string
  status: string
  price?: number
  errorCode?: string
  errorMessage?: string
}

// =============================================================================
// DECRYPTION
// Currently using plain text for MVP - will implement encryption in Phase 2
// =============================================================================

async function decryptCredential(encrypted: string): Promise<string> {
  // If credentials are stored in plain text (dev only!), return as-is
  if (!encrypted.startsWith('enc:')) {
    return encrypted
  }
  
  // TODO: Implement encryption with Supabase Vault or Node crypto
  // For now, throw error if encrypted credentials are passed
  throw new Error('Encrypted credentials not yet supported - store as plain text for MVP')
}

// =============================================================================
// SEND SMS
// =============================================================================

export async function sendCampaignSMS(params: SendCampaignSMSParams): Promise<TwilioSendResult> {
  const { to, from, body, accountSid, authToken, statusCallback } = params
  
  // Decrypt credentials (or pass through if plain text)
  const decryptedSid = await decryptCredential(accountSid)
  const decryptedToken = await decryptCredential(authToken)
  
  // Initialize Twilio client with tenant credentials
  const client = twilio(decryptedSid, decryptedToken)
  
  try {
    const message = await client.messages.create({
      to: formatE164(to),
      from: formatE164(from),
      body: body,
      statusCallback: statusCallback || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
    })
    
    return {
      sid: message.sid,
      status: message.status,
      price: message.price ? parseFloat(message.price) : undefined,
    }
  } catch (error: unknown) {
    const twilioError = error as { code?: number; message: string }
    console.error('Twilio send error:', twilioError)
    
    return {
      sid: '',
      status: 'failed',
      errorCode: twilioError.code?.toString(),
      errorMessage: twilioError.message,
    }
  }
}

// =============================================================================
// SEND BATCH (for MCP integration)
// =============================================================================

interface BatchLead {
  phone: string
  firstName?: string
  lastName?: string
}

interface BatchResult {
  success: boolean
  sent: number
  failed: number
  cost: number
  results: Array<{
    phone: string
    status: 'sent' | 'failed'
    sid?: string
    error?: string
  }>
}

export async function sendCampaignSMSBatch(
  leads: BatchLead[],
  messageTemplate: string,
  businessConfig: {
    twilioAccountSid: string
    twilioAuthToken: string
    twilioPhoneNumber: string
    businessName: string
    service?: string
  },
  dryRun = true
): Promise<BatchResult> {
  const results: BatchResult['results'] = []
  let totalCost = 0
  
  for (const lead of leads) {
    // Personalize message
    const personalizedMessage = messageTemplate
      .replace(/{firstName}/g, lead.firstName || 'there')
      .replace(/{lastName}/g, lead.lastName || '')
      .replace(/{businessName}/g, businessConfig.businessName)
      .replace(/{service}/g, businessConfig.service || 'your appointment')
    
    if (dryRun) {
      // Simulate send
      results.push({
        phone: lead.phone,
        status: 'sent',
        sid: `SIM_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      })
      totalCost += 0.0079 // Average SMS cost
    } else {
      // Real send
      const result = await sendCampaignSMS({
        to: lead.phone,
        from: businessConfig.twilioPhoneNumber,
        body: personalizedMessage,
        accountSid: businessConfig.twilioAccountSid,
        authToken: businessConfig.twilioAuthToken,
      })
      
      results.push({
        phone: lead.phone,
        status: result.status === 'failed' ? 'failed' : 'sent',
        sid: result.sid,
        error: result.errorMessage,
      })
      
      if (result.price) {
        totalCost += result.price
      }
    }
    
    // Rate limiting (avoid Twilio throttling)
    if (!dryRun) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  const sent = results.filter(r => r.status === 'sent').length
  const failed = results.filter(r => r.status === 'failed').length
  
  return {
    success: failed === 0,
    sent,
    failed,
    cost: totalCost,
    results,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function formatE164(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // If 10 digits (US), add +1
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // If 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // If already has +, return as-is
  if (phone.startsWith('+')) {
    return phone
  }
  
  // Default: assume needs +
  return `+${digits}`
}

// =============================================================================
// COMPLIANCE: Check opt-out keywords
// =============================================================================

const OPT_OUT_KEYWORDS = [
  'stop',
  'unsubscribe',
  'cancel',
  'end',
  'quit',
  'optout',
  'opt out',
  'remove',
  'delete',
]

export function isOptOutMessage(text: string): boolean {
  const normalized = text.toLowerCase().trim()
  return OPT_OUT_KEYWORDS.some(keyword => normalized === keyword || normalized.startsWith(keyword + ' '))
}

// =============================================================================
// SENTIMENT: Basic positive/negative detection
// =============================================================================

const POSITIVE_KEYWORDS = [
  'yes',
  'yeah',
  'yep',
  'sure',
  'ok',
  'okay',
  'interested',
  'available',
  'book',
  'schedule',
  'appointment',
  'when',
  'what time',
  'tomorrow',
  'today',
  'this week',
  'next week',
]

const NEGATIVE_KEYWORDS = [
  'no',
  'nope',
  'not interested',
  'busy',
  'can\'t',
  'cannot',
  'won\'t',
  'later',
  'maybe later',
  'not now',
  'wrong number',
]

export function analyzeResponseSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'opt_out' {
  const normalized = text.toLowerCase().trim()
  
  // Check opt-out first
  if (isOptOutMessage(normalized)) {
    return 'opt_out'
  }
  
  // Check for positive signals
  for (const keyword of POSITIVE_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return 'positive'
    }
  }
  
  // Check for negative signals
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return 'negative'
    }
  }
  
  return 'neutral'
}

// =============================================================================
// EXTRACT BOOKING INTENT
// Looks for time/date mentions like "Friday at 2pm"
// =============================================================================

export function extractBookingIntent(text: string): string | null {
  const patterns = [
    // Day + time: "Friday at 2pm", "Monday 3:30"
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*?\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    // Tomorrow/today + time
    /\b(tomorrow|today)\b.*?\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    // Time only: "at 2pm", "around 3"
    /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    // Date format: "1/15", "Jan 15"
    /\b(\d{1,2}\/\d{1,2}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0]
    }
  }
  
  return null
}
