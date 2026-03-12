/**
 * Twilio Subaccount Model
 * Create isolated subaccounts for each business under your master account
 * All share your A2P 10DLC approval = instant SMS activation
 */

import twilio from 'twilio'

interface CreateSubaccountParams {
  businessId: string
  businessName: string
  ownerEmail: string
}

interface SubaccountResult {
  subaccountSid: string
  authToken: string
  phoneNumber?: string
}

/**
 * Create a Twilio subaccount for a new business
 * They get isolated messaging under your shared A2P approval
 */
export async function createBusinessSubaccount(
  params: CreateSubaccountParams
): Promise<SubaccountResult> {
  const masterSid = process.env.TWILIO_MASTER_ACCOUNT_SID
  const masterToken = process.env.TWILIO_MASTER_AUTH_TOKEN

  if (!masterSid || !masterToken) {
    throw new Error('Master Twilio credentials not configured')
  }

  // Initialize master account client
  const client = twilio(masterSid, masterToken)

  // Create subaccount
  const subaccount = await client.api.accounts.create({
    friendlyName: `${params.businessName} (ID: ${params.businessId})`,
  })

  console.log(`Created subaccount: ${subaccount.sid}`)

  // Store in your database
  // await supabase.from('businesses').update({
  //   twilio_account_sid_encrypted: subaccount.sid,
  //   twilio_auth_token_encrypted: subaccount.authToken,
  //   twilio_subaccount: true,
  //   twilio_parent_account: masterSid,
  // }).eq('id', params.businessId)

  return {
    subaccountSid: subaccount.sid,
    authToken: subaccount.authToken || '',
  }
}

/**
 * Provision a phone number for the subaccount
 * Optional: Let them choose area code or auto-assign
 */
export async function provisionPhoneNumber(
  subaccountSid: string,
  areaCode?: string
): Promise<string> {
  const masterSid = process.env.TWILIO_MASTER_ACCOUNT_SID
  const masterToken = process.env.TWILIO_MASTER_AUTH_TOKEN

  // Create client for the subaccount
  const client = twilio(masterSid!, masterToken!, { accountSid: subaccountSid })

  // Search for available numbers
  const numbers = await client.availablePhoneNumbers('US').local.list({
    areaCode: areaCode || undefined,
    smsEnabled: true,
    voiceEnabled: true,
    limit: 1,
  })

  if (numbers.length === 0) {
    throw new Error(`No numbers available${areaCode ? ` in area code ${areaCode}` : ''}`)
  }

  // Purchase the number
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: numbers[0].phoneNumber,
    smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/inbound`,
    smsMethod: 'POST',
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
    statusCallbackMethod: 'POST',
  })

  console.log(`Provisioned number: ${purchased.phoneNumber}`)

  return purchased.phoneNumber
}

/**
 * Onboarding flow with subaccounts
 */
export async function onboardBusinessWithSMS(
  businessId: string,
  businessName: string,
  ownerEmail: string,
  preferredAreaCode?: string
): Promise<{ phoneNumber: string; ready: boolean }> {
  // Step 1: Create subaccount
  const subaccount = await createBusinessSubaccount({
    businessId,
    businessName,
    ownerEmail,
  })

  // Step 2: Provision phone number
  const phoneNumber = await provisionPhoneNumber(
    subaccount.subaccountSid,
    preferredAreaCode
  )

  // Step 3: Update database
  // await supabase.from('businesses').update({
  //   twilio_phone_number: phoneNumber,
  //   sms_enabled: true,
  // }).eq('id', businessId)

  return {
    phoneNumber,
    ready: true, // SMS ready immediately!
  }
}
