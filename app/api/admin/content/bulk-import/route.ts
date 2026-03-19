import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiSuccess, ApiError } from '@/types/api'
import { bulkImportContent } from '@/lib/content/bulk-importer'

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
    
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json<ApiError>(
        { error: { code: 'BAD_REQUEST', message: 'items array is required' } }, { status: 400 }
      )
    }

    const report = await bulkImportContent(body.items, supabase)
    return NextResponse.json<ApiSuccess<typeof report>>({ data: report })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 }
    )
  }
}
