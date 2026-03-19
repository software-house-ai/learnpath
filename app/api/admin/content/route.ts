import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiSuccess, ApiError, ContentItem } from '@/types/api'

export async function GET(request: NextRequest) {
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

    let query = supabase
      .from('content_items')
      .select(`*, skills(name, domain_id, domains(name))`, { count: 'exact' })

    const { searchParams } = new URL(request.url)
    const skill_id = searchParams.get('skill_id')
    const content_type = searchParams.get('content_type')
    const difficulty_level = searchParams.get('difficulty_level')
    const is_active = searchParams.get('is_active')
    const needs_review = searchParams.get('needs_review')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (skill_id) query = query.eq('skill_id', skill_id)
    if (content_type) query = query.eq('content_type', content_type)
    if (difficulty_level) query = query.eq('difficulty_level', difficulty_level)
    if (is_active !== null && is_active !== '') query = query.eq('is_active', is_active === 'true')
    if (needs_review !== null && needs_review !== '') query = query.eq('needs_review', needs_review === 'true')

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return NextResponse.json<ApiSuccess<ContentItem[]>>({
      data: (data || []) as ContentItem[],
      meta: { total: count || 0, page }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content items' } }, { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { title, url, skill_id, content_type, difficulty_level } = body

    if (!title || !url || !skill_id || !content_type || !difficulty_level) {
      return NextResponse.json<ApiError>(
        { error: { code: 'BAD_REQUEST', message: 'Missing required fields' } }, { status: 400 }
      )
    }

    try { new URL(url) } catch {
      return NextResponse.json<ApiError>(
        { error: { code: 'BAD_REQUEST', message: 'Invalid URL' } }, { status: 400 }
      )
    }

    const { data: existing } = await supabase.from('content_items').select('id').eq('url', url).single()
    if (existing) {
      return NextResponse.json<ApiError>(
        { error: { code: 'CONFLICT', message: 'URL already exists' } }, { status: 409 }
      )
    }

    const { data, error } = await supabase.from('content_items').insert({
      ...body,
      is_active: body.is_active !== undefined ? body.is_active : true,
      needs_review: body.needs_review || false,
      last_verified_at: new Date().toISOString()
    }).select().single()

    if (error) throw error

    return NextResponse.json<ApiSuccess<ContentItem>>({ data: data as ContentItem }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create content item' } }, { status: 500 }
    )
  }
}
