import sgMail from '@sendgrid/mail'
import twilio from 'twilio'

export type EmailProviderName = 'sendgrid' | 'postmark' | 'resend' | 'mailchimp'
export type SmsProviderName = 'twilio' | 'telnyx' | 'vonage'

export interface EmailSendParams {
  to: string
  cc?: string[]
  fromEmail: string
  fromName?: string
  subject: string
  html: string
  text?: string
  customArgs?: Record<string, string>
  tracking?: boolean
}

export interface SmsSendParams {
  to: string
  from: string
  body: string
  statusCallback?: string
  accountSid?: string
  authToken?: string
}

export interface ProviderSendResult {
  success: boolean
  messageId?: string
  error?: string
}

interface MailchimpTransactionalSendResponseItem {
  email?: string
  status?: string
  _id?: string
  reject_reason?: string
}

let sendgridInitialized = false

function initSendGrid() {
  if (sendgridInitialized) {
    return
  }

  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    sendgridInitialized = true
  }
}

export function getEmailProviderName(): EmailProviderName {
  const configured = (process.env.EMAIL_PROVIDER || 'sendgrid').toLowerCase()
  if (configured === 'postmark' || configured === 'resend' || configured === 'mailchimp') {
    return configured
  }
  return 'sendgrid'
}

export function getSmsProviderName(): SmsProviderName {
  const configured = (process.env.SMS_PROVIDER || 'twilio').toLowerCase()
  if (configured === 'telnyx' || configured === 'vonage') {
    return configured
  }
  return 'twilio'
}

export function isEmailProviderConfigured(): boolean {
  const provider = getEmailProviderName()

  if (provider === 'sendgrid') {
    return Boolean(process.env.SENDGRID_API_KEY)
  }

  if (provider === 'mailchimp') {
    return Boolean(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY)
  }

  return false
}

export function isSmsProviderConfigured(params?: Pick<SmsSendParams, 'accountSid' | 'authToken'>): boolean {
  const provider = getSmsProviderName()

  if (provider === 'twilio') {
    return Boolean((params?.accountSid || process.env.TWILIO_ACCOUNT_SID) && (params?.authToken || process.env.TWILIO_AUTH_TOKEN))
  }

  return false
}

export async function sendEmailMessage(params: EmailSendParams): Promise<ProviderSendResult> {
  const provider = getEmailProviderName()

  if (provider === 'mailchimp') {
    const apiKey = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY
    if (!apiKey) {
      return {
        success: false,
        error: 'Mailchimp Transactional API key not configured',
      }
    }

    const baseUrl = process.env.MAILCHIMP_TRANSACTIONAL_API_BASE || 'https://mandrillapp.com/api/1.0'

    try {
      const response = await fetch(`${baseUrl}/messages/send.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: apiKey,
          message: {
            html: params.html,
            text: params.text,
            subject: params.subject,
            from_email: params.fromEmail,
            from_name: params.fromName,
            to: [
              {
                email: params.to,
                type: 'to',
              },
              ...(params.cc || []).map((email) => ({
                email,
                type: 'cc' as const,
              })),
            ],
            track_opens: params.tracking !== false,
            track_clicks: params.tracking !== false,
            metadata: params.customArgs,
          },
          async: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Mailchimp Transactional error (${response.status}): ${errorText}`,
        }
      }

      const data = (await response.json()) as MailchimpTransactionalSendResponseItem[]
      const first = Array.isArray(data) ? data[0] : null
      const acceptedStatus = first?.status === 'sent' || first?.status === 'queued' || first?.status === 'scheduled'

      return {
        success: Boolean(acceptedStatus),
        messageId: first?._id,
        error: acceptedStatus ? undefined : (first?.reject_reason || `Mailchimp status ${first?.status || 'unknown'}`),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Mailchimp provider error',
      }
    }
  }

  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const from = params.fromName
        ? `${params.fromName} <${params.fromEmail}>`
        : params.fromEmail
      const { data, error } = await resend.emails.send({
        from,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html: params.html,
        text: params.text,
      })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true, messageId: data?.id }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Resend error',
      }
    }
  }

  if (provider !== 'sendgrid') {
    return {
      success: false,
      error: `Email provider ${provider} is selected but not implemented yet`,
    }
  }

  if (!process.env.SENDGRID_API_KEY) {
    return {
      success: false,
      error: 'SendGrid API key not configured',
    }
  }

  initSendGrid()

  try {
    const [response] = await sgMail.send({
      to: params.to,
      cc: params.cc,
      from: {
        email: params.fromEmail,
        name: params.fromName,
      },
      subject: params.subject,
      html: params.html,
      text: params.text,
      customArgs: params.customArgs,
      trackingSettings: params.tracking === false
        ? undefined
        : {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
    })

    return {
      success: response?.statusCode === 202,
      messageId: (response?.headers?.['x-message-id'] || response?.headers?.['X-Message-Id']) as string | undefined,
      error: response?.statusCode === 202 ? undefined : `SendGrid status ${response?.statusCode}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email provider error',
    }
  }
}

export async function sendSmsMessage(params: SmsSendParams): Promise<ProviderSendResult> {
  const provider = getSmsProviderName()

  if (provider !== 'twilio') {
    return {
      success: false,
      error: `SMS provider ${provider} is selected but not implemented yet`,
    }
  }

  const accountSid = params.accountSid || process.env.TWILIO_ACCOUNT_SID
  const authToken = params.authToken || process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return {
      success: false,
      error: 'Twilio credentials not configured',
    }
  }

  try {
    const client = twilio(accountSid, authToken)
    const result = await client.messages.create({
      to: params.to,
      from: params.from,
      body: params.body,
      statusCallback: params.statusCallback,
    })

    return {
      success: true,
      messageId: result.sid,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS provider error',
    }
  }
}
