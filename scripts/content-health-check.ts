import { createClient } from '@supabase/supabase-js'
import { checkUrls } from '../lib/content/health-checker'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role to read all items past RLS
)

async function run() {
  console.log('🔍 Starting content health check...')

  // Load all active content items
  const { data: items, error } = await supabase
    .from('content_items')
    .select('id, url, title')
    .eq('is_active', true)

  if (error) { console.error('Failed to load items:', error.message); process.exit(1) }
  if (!items || items.length === 0) { console.log('No active items to check.'); return }

  console.log(`Checking ${items.length} URLs...`)

  const urls = items.map((i: any) => i.url)
  const results = await checkUrls(urls)

  // Find failed URLs
  const failedUrls = new Set(results.filter(r => !r.is_valid).map(r => r.url))
  const failedItems = items.filter((i: any) => failedUrls.has(i.url))

  console.log(`✅ Valid: ${items.length - failedItems.length}`)
  console.log(`❌ Failed: ${failedItems.length}`)

  if (failedItems.length > 0) {
    // Mark failed items as needs_review
    const failedIds = failedItems.map((i: any) => i.id)
    const { error: updateError } = await supabase
      .from('content_items')
      .update({ needs_review: true, last_verified_at: new Date().toISOString() })
      .in('id', failedIds)
    if (updateError) console.error('Failed to update items:', updateError.message)
    else console.log(`Marked ${failedIds.length} items as needs_review`)
  }

  // Update last_verified_at for all valid items
  const validUrls = results.filter(r => r.is_valid).map(r => r.url)
  const validIds = items.filter((i: any) => validUrls.includes(i.url)).map((i: any) => i.id)
  if (validIds.length > 0) {
    await supabase.from('content_items')
      .update({ last_verified_at: new Date().toISOString() })
      .in('id', validIds)
  }

  console.log('🎉 Health check complete.')
}

run().catch(e => { console.error('Health check failed:', e.message); process.exit(1) })
