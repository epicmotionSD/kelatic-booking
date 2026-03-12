#!/usr/bin/env bun
/**
 * Webhook Verification Script
 * Tests all webhook endpoints to ensure they're configured correctly
 */

import { createClient } from '@supabase/supabase-js'

const PROD_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kelatic.com'
const TEST_PHONE = '+13055551234' // Replace with your test phone

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  details?: string
}

const results: TestResult[] = []

async function testSendGridWebhook() {
  console.log('\n🔍 Testing SendGrid webhook...')

  try {
    const response = await fetch(`${PROD_URL}/api/webhooks/sendgrid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          email: 'test@example.com',
          event: 'delivered',
          sg_message_id: 'test-verify-' + Date.now(),
          timestamp: Math.floor(Date.now() / 1000),
        },
      ]),
    })

    const text = await response.text()

    if (response.ok) {
      results.push({
        name: 'SendGrid Webhook',
        status: 'pass',
        message: `✅ Responding with status ${response.status}`,
        details: text,
      })
    } else if (response.status === 401) {
      results.push({
        name: 'SendGrid Webhook',
        status: 'pass',
        message: '✅ Endpoint exists (requires auth in production)',
        details: 'This is expected. SendGrid will provide auth headers.',
      })
    } else {
      results.push({
        name: 'SendGrid Webhook',
        status: 'fail',
        message: `❌ Unexpected status: ${response.status}`,
        details: text,
      })
    }
  } catch (error) {
    results.push({
      name: 'SendGrid Webhook',
      status: 'fail',
      message: `❌ Connection error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

async function testTwilioStatusWebhook() {
  console.log('🔍 Testing Twilio Status webhook...')

  try {
    const formData = new URLSearchParams()
    formData.append('MessageSid', 'SM' + Date.now())
    formData.append('MessageStatus', 'delivered')

    const response = await fetch(`${PROD_URL}/api/webhooks/twilio/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    })

    const text = await response.text()

    if (response.ok) {
      results.push({
        name: 'Twilio Status Webhook',
        status: 'pass',
        message: `✅ Responding with status ${response.status}`,
        details: text,
      })
    } else {
      results.push({
        name: 'Twilio Status Webhook',
        status: 'fail',
        message: `❌ Status: ${response.status}`,
        details: text,
      })
    }
  } catch (error) {
    results.push({
      name: 'Twilio Status Webhook',
      status: 'fail',
      message: `❌ Connection error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

async function testTwilioInboundWebhook() {
  console.log('🔍 Testing Twilio Inbound webhook...')

  try {
    const formData = new URLSearchParams()
    formData.append('MessageSid', 'SM' + Date.now())
    formData.append('From', TEST_PHONE)
    formData.append('To', '+18559010579')
    formData.append('Body', 'Test inbound message')

    const response = await fetch(`${PROD_URL}/api/webhooks/twilio/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    })

    const text = await response.text()

    if (response.ok && text.includes('<Response>')) {
      results.push({
        name: 'Twilio Inbound Webhook',
        status: 'pass',
        message: `✅ Returns valid TwiML response`,
        details: 'Endpoint is working correctly',
      })
    } else if (response.ok) {
      results.push({
        name: 'Twilio Inbound Webhook',
        status: 'pass',
        message: `✅ Responding with status ${response.status}`,
        details: text,
      })
    } else {
      results.push({
        name: 'Twilio Inbound Webhook',
        status: 'fail',
        message: `❌ Status: ${response.status}`,
        details: text,
      })
    }
  } catch (error) {
    results.push({
      name: 'Twilio Inbound Webhook',
      status: 'fail',
      message: `❌ Connection error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

async function checkRecentDeliveries() {
  console.log('🔍 Checking for recent webhook activity...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    results.push({
      name: 'Database Check',
      status: 'skip',
      message: '⚠️ Missing Supabase credentials',
    })
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Check for delivered messages in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: deliveredMessages, error: deliveredError } = await supabase
      .from('campaign_messages')
      .select('id, status, delivered_at, channel')
      .eq('direction', 'outbound')
      .eq('status', 'delivered')
      .gte('created_at', oneDayAgo)
      .limit(10)

    const { data: inboundMessages, error: inboundError } = await supabase
      .from('campaign_messages')
      .select('id, body, sentiment, received_at')
      .eq('direction', 'inbound')
      .gte('created_at', oneDayAgo)
      .limit(10)

    if (!deliveredError && deliveredMessages && deliveredMessages.length > 0) {
      results.push({
        name: 'Recent Deliveries',
        status: 'pass',
        message: `✅ Found ${deliveredMessages.length} delivered messages in last 24h`,
        details: `Webhooks are working! ${deliveredMessages.filter(m => m.channel === 'email').length} emails, ${deliveredMessages.filter(m => m.channel === 'sms').length} SMS`,
      })
    } else {
      results.push({
        name: 'Recent Deliveries',
        status: 'skip',
        message: '⚠️ No delivered messages in last 24 hours',
        details: 'This is normal if you haven\'t sent campaigns recently',
      })
    }

    if (!inboundError && inboundMessages && inboundMessages.length > 0) {
      results.push({
        name: 'Inbound Responses',
        status: 'pass',
        message: `✅ Found ${inboundMessages.length} responses in last 24h`,
        details: `Sentiment: ${inboundMessages.filter(m => m.sentiment === 'positive').length} positive, ${inboundMessages.filter(m => m.sentiment === 'negative').length} negative`,
      })
    } else {
      results.push({
        name: 'Inbound Responses',
        status: 'skip',
        message: '⚠️ No inbound responses in last 24 hours',
        details: 'Send a test campaign and reply to verify',
      })
    }
  } catch (error) {
    results.push({
      name: 'Database Check',
      status: 'fail',
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

async function checkTwilioConfiguration() {
  console.log('🔍 Checking Twilio configuration in database...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    results.push({
      name: 'Twilio Config',
      status: 'skip',
      message: '⚠️ Missing Supabase credentials',
    })
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, twilio_phone_number')
      .eq('id', 'f0c07a53-c001-486b-a30d-c1102b4dfadf')
      .single()

    if (business && business.twilio_phone_number) {
      results.push({
        name: 'Twilio Configuration',
        status: 'pass',
        message: `✅ ${business.name} has Twilio number configured`,
        details: `Phone: ${business.twilio_phone_number}`,
      })
    } else {
      results.push({
        name: 'Twilio Configuration',
        status: 'fail',
        message: '❌ No Twilio phone number configured',
        details: 'Set twilio_phone_number in businesses table',
      })
    }
  } catch (error) {
    results.push({
      name: 'Twilio Config',
      status: 'fail',
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

async function main() {
  console.log('🔍 Webhook Verification Script')
  console.log('================================\n')
  console.log(`Testing webhooks at: ${PROD_URL}\n`)

  await testSendGridWebhook()
  await testTwilioStatusWebhook()
  await testTwilioInboundWebhook()
  await checkTwilioConfiguration()
  await checkRecentDeliveries()

  console.log('\n\n📊 Verification Report')
  console.log('======================\n')

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skip').length

  results.forEach(result => {
    console.log(`${result.message}`)
    if (result.details) {
      console.log(`   ${result.details}`)
    }
    console.log()
  })

  console.log('Summary:')
  console.log(`✅ Pass: ${passed}`)
  console.log(`❌ Fail: ${failed}`)
  console.log(`⚠️  Skip: ${skipped}`)

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the details above.')
    process.exit(1)
  } else if (passed === 0) {
    console.log('\n⚠️  No tests passed. Webhooks may not be configured yet.')
    console.log('\nFollow the guide: scripts/configure-webhooks.md')
    process.exit(1)
  } else {
    console.log('\n✅ All webhook tests passed! Your system is ready.')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('Script error:', error)
  process.exit(1)
})
