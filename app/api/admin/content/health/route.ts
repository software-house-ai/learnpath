import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiSuccess, ApiError, ContentItem } from '@/types/api'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiError>(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 }
    )
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 }
    )

    const { data, error } = await supabase
      .from('content_items')
      .select('*, skills(name)')
      .eq('needs_review', true)
      .order('last_verified_at', { ascending: true })

    if (error) throw error

    return NextResponse.json<ApiSuccess<ContentItem[]>>({ data: (data || []) as ContentItem[] })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content items needing review' } }, { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiError>(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 }
    )
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 }
    )

    const body = await request.json()
    const { id, action, url } = body

    if (!id || !action) {
      return NextResponse.json<ApiError>(
        { error: { code: 'BAD_REQUEST', message: 'id and action are required' } }, { status: 400 }
      )
    }

    let updateData: Partial<ContentItem> = {}

    if (action === 'mark_fixed') {
      updateData = { needs_review: false, last_verified_at: new Date().toISOString() }
    } else if (action === 'deactivate') {
      updateData = { is_active: false, needs_review: false }
    } else if (action === 'update_url') {
      if (!url) {
        return NextResponse.json<ApiError>(
          { error: { code: 'BAD_REQUEST', message: 'url is required for update_url action' } }, { status: 400 }
        )
      }
      try { new URL(url) } catch {
        return NextResponse.json<ApiError>(
          { error: { code: 'BAD_REQUEST', message: 'Invalid URL format' } }, { status: 400 }
        )
      }

      const { data: existing } = await supabase
        .from('content_items')
        .select('id')
        .eq('url', url)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json<ApiError>(
          { error: { code: 'CONFLICT', message: 'URL already exists' } }, { status: 409 }
        )
      }

      updateData = { url, needs_review: false, last_verified_at: new Date().toISOString() }
    } else {
      return NextResponse.json<ApiError>(
        { error: { code: 'BAD_REQUEST', message: 'Invalid action' } }, { status: 400 }
      )
    }

    const { error } = await supabase
      .from('content_items')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json<ApiSuccess<{ updated: boolean }>>({ data: { updated: true } })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update content item' } }, { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiError>(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 }
    )
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    
    // We could skip auth check for a background cron using a secret, but since invoked from UI we check admin.
    if (profile?.role !== 'admin') return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 }
    )

    // Fetch items that need verification (active)
    // In a real cron, maybe only check items haven't been checked in a week. For now, check all active.
    const { data: items, error: fetchError } = await supabase
      .from('content_items')
      .select('id, url')
      .eq('is_active', true)
      
    if (fetchError) throw fetchError

    const { checkUrl } = await import('@/lib/content/health-checker')
    
    let processed = 0
    let brokenItems = 0

    // Process in sequential small batches
    const batchSize = 10
    const itemsToProcess = items || []
    
    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      const batch = itemsToProcess.slice(i, i + batchSize)
      const checks = await Promise.all(
        batch.map(async (item) => {
          const result = await checkUrl(item.url)
          return { item, result }
        })
      )
      
      for (const { item, result } of checks) {
        processed++
        if (!result.is_valid) {
          brokenItems++
          await supabase
            .from('content_items')
            .update({ 
               needs_review: true, 
               last_verified_at: new Date().toISOString() 
            })
            .eq('id', item.id)
        } else {
          await supabase
            .from('content_items')
            .update({ 
               last_verified_at: new Date().toISOString() 
            })
            .eq('id', item.id)
        }
      }
    }

    return NextResponse.json<ApiSuccess<{ processed: number, brokenItems: number }>>({ 
      data: { processed, brokenItems } 
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to run health check' } }, { status: 500 }
    )
  }
}
