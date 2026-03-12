import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function getKelaticBusinessId() {
  console.log('Searching for Kelatic business...\n')

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, slug, twilio_phone_number, plan, created_at')
    .or('slug.ilike.%kelatic%,name.ilike.%kelatic%')

  if (error) {
    console.error('Error querying businesses:', error.message)
    process.exit(1)
  }

  if (!businesses || businesses.length === 0) {
    console.log('❌ No Kelatic business found in database')
    console.log('\nSearching all businesses...')

    const { data: allBusinesses } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .order('created_at', { ascending: false })
      .limit(10)

    if (allBusinesses && allBusinesses.length > 0) {
      console.log('\nRecent businesses:')
      allBusinesses.forEach((b, i) => {
        console.log(`${i + 1}. ${b.name} (slug: ${b.slug})`)
        console.log(`   ID: ${b.id}`)
      })
    }
    return
  }

  console.log('✅ Found Kelatic business:\n')
  businesses.forEach(business => {
    console.log(`Name: ${business.name}`)
    console.log(`ID: ${business.id}`)
    console.log(`Slug: ${business.slug}`)
    console.log(`Twilio Phone: ${business.twilio_phone_number || '(not set)'}`)
    console.log(`Plan: ${business.plan || 'free'}`)
    console.log(`Created: ${new Date(business.created_at).toLocaleDateString()}`)
    console.log('')
  })

  console.log('Copy this for testing:')
  console.log(`--businessId ${businesses[0].id}`)
}

getKelaticBusinessId().catch(error => {
  console.error('Script error:', error.message)
  process.exit(1)
})
