import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiSuccess, Domain } from '@/types/api'

async function verifyAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      ),
      supabase: null,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      ),
      supabase: null,
    }
  }

  return { error: null, supabase }
}

export async function GET() {
  try {
    const { error, supabase } = await verifyAdmin()
    if (error) return error

    const { data, error: dbError } = await supabase!
      .from('domains')
      .select('*')
      .order('display_order', { ascending: true })

    if (dbError) throw dbError

    return NextResponse.json({ data } satisfies ApiSuccess<Domain[]>)
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, supabase } = await verifyAdmin()
    if (error) return error

    const body = await request.json()
    const { name, slug, description, icon_name, color_hex, display_order, is_published } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'name is required' } },
        { status: 400 }
      )
    }
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'slug is required' } },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase!
      .from('domains')
      .select('id')
      .eq('slug', slug.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Slug already exists' } },
        { status: 409 }
      )
    }

    const { data, error: dbError } = await supabase!
      .from('domains')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description ?? null,
        icon_name: icon_name ?? null,
        color_hex: color_hex ?? '#6366f1',
        display_order: display_order ?? 0,
        is_published: is_published ?? false,
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({ data } satisfies ApiSuccess<Domain>, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, supabase } = await verifyAdmin()
    if (error) return error

    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'id is required' } },
        { status: 400 }
      )
    }

    const { data, error: dbError } = await supabase!
      .from('domains')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({ data } satisfies ApiSuccess<Domain>)
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, supabase } = await verifyAdmin()
    if (error) return error

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'id is required' } },
        { status: 400 }
      )
    }

    const { error: dbError } = await supabase!
      .from('domains')
      .delete()
      .eq('id', id)

    if (dbError) throw dbError

    return NextResponse.json({ data: { deleted: true } } satisfies ApiSuccess<{ deleted: true }>)
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    )
  }
}
