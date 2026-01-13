// =============================================================================
// INNGEST API ROUTE HANDLER
// Serves the Inngest functions for the Inngest cloud to invoke
// POST /api/inngest
// =============================================================================

import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import {
  runHummingbirdCadence,
  handleHotLead,
} from '@/lib/inngest/functions'

// Create the serve handler with all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runHummingbirdCadence,
    handleHotLead,
    // Add more functions here as you build them
  ],
})
