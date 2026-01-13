// =============================================================================
// INNGEST CLIENT SETUP
// Serverless job queue for Hummingbird cadence scheduling
// =============================================================================

import { Inngest } from 'inngest'

// Create the Inngest client
export const inngest = new Inngest({
  id: 'x3o-campaign-engine',
  name: 'x3o Campaign Engine',
})

// =============================================================================
// EVENT TYPES
// Define all events the campaign engine can emit/handle
// =============================================================================

export type CampaignEvents = {
  // Campaign lifecycle
  'campaign/created': {
    data: {
      campaignId: string
      businessId: string
      totalLeads: number
    }
  }
  
  'campaign/started': {
    data: {
      campaignId: string
      businessId: string
    }
  }
  
  'campaign/paused': {
    data: {
      campaignId: string
      reason?: string
    }
  }
  
  'campaign/completed': {
    data: {
      campaignId: string
      metrics: {
        sent: number
        delivered: number
        responses: number
        bookings: number
        revenue: number
      }
    }
  }
  
  // Cadence steps
  'cadence/send-batch': {
    data: {
      campaignId: string
      businessId: string
      day: number
      scriptVariant: 'direct_inquiry' | 'file_closure' | 'gift' | 'breakup'
      leadIds: string[]
    }
  }
  
  'cadence/day-complete': {
    data: {
      campaignId: string
      day: number
      sent: number
      failed: number
    }
  }
  
  // Individual message events
  'message/send': {
    data: {
      campaignId: string
      leadId: string
      messageId: string
      phone: string
      body: string
    }
  }
  
  'message/delivered': {
    data: {
      messageId: string
      twilioSid: string
    }
  }
  
  'message/failed': {
    data: {
      messageId: string
      errorCode: string
      errorMessage: string
    }
  }
  
  // Inbound response
  'message/received': {
    data: {
      businessId: string
      campaignId?: string
      leadId?: string
      from: string
      to: string
      body: string
      twilioSid: string
    }
  }
  
  // Hot lead alert
  'lead/hot': {
    data: {
      campaignId: string
      leadId: string
      leadName: string
      phone: string
      responseText: string
      extractedIntent?: string
    }
  }
}

// Type helper for event names
export type CampaignEventName = keyof CampaignEvents
