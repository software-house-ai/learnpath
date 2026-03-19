import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiSuccess, ApiError, ContentItem } from '@/types/api'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const id = resolvedParams.id
    const body = await request.json()

    if (body.url) {
      try { new URL(body.url) } catch {
        return NextResponse.json<ApiError>(
          { error: { code: 'BAD_REQUEST', message: 'Invalid URL' } }, { status: 400 }
        )
      }

      const { data: existing } = await supabase
        .from('content_items')
        .select('id')
        .eq('url', body.url)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json<ApiError>(
          { error: { code: 'CONFLICT', message: 'URL already exists' } }, { status: 409 }
        )
      }
    }

    const { data, error } = await supabase
      .from('content_items')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json<ApiSuccess<ContentItem>>({ data: data as ContentItem })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update content item' } }, { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const id = resolvedParams.id

    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json<ApiSuccess<{ deleted: boolean }>>({ data: { deleted: true } })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete content item' } }, { status: 500 }
    )
  }
}
