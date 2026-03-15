import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiSuccess, ApiError, Skill } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json<ApiError>(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('skills')
      .select(`
        *,
        domains ( name ),
        skill_prerequisites!skill_id(
          prerequisite_skill_id,
          strength,
          prerequisite:skills!skill_prerequisites_prerequisite_skill_id_fkey(
            id,
            name
          )
        )
      `)

    if (error) throw error

    // Transform and sort the data locally to match the required format
    const transformedData = data.map((skill: any) => ({
      ...skill,
      domain_name: skill.domains?.name || null,
      prerequisites: skill.skill_prerequisites?.map((sp: any) => ({
        id: sp.prerequisite?.id,
        name: sp.prerequisite?.name,
        strength: sp.strength
      })) || []
    })).sort((a, b) => {
      const nameA = a.domain_name || ''
      const nameB = b.domain_name || ''
      if (nameA !== nameB) {
        return nameA.localeCompare(nameB)
      }
      return (a.difficulty || 0) - (b.difficulty || 0)
    })

    return NextResponse.json<ApiSuccess<any>>({ data: transformedData })
  } catch (error: any) {
    console.error('Error fetching skills:', error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json<ApiError>(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      slug, 
      domain_id, 
      description, 
      difficulty, 
      estimated_hours, 
      is_published, 
      prerequisites 
    } = body

    if (!name || !slug || !domain_id) {
      return NextResponse.json<ApiError>(
        { error: { code: 'BAD_REQUEST', message: 'Missing required fields: name, slug, or domain_id' } },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from('skills')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json<ApiError>(
        { error: { code: 'CONFLICT', message: 'A skill with this slug already exists' } },
        { status: 409 }
      )
    }

    // Insert skill
    const { data: newSkill, error: insertError } = await supabase
      .from('skills')
      .insert({
        name,
        slug,
        domain_id,
        description,
        difficulty,
        estimated_hours,
        is_published
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Insert prerequisites if any
    if (prerequisites && Array.isArray(prerequisites) && prerequisites.length > 0) {
      const prereqRows = prerequisites.map((prereqId: string) => ({
        skill_id: newSkill.id,
        prerequisite_skill_id: prereqId,
        strength: 'required'
      }))

      const { error: prereqError } = await supabase
        .from('skill_prerequisites')
        .insert(prereqRows)

      if (prereqError) {
        console.error('Error adding prerequisites:', prereqError)
        // Keep going since the skill was created but log it
      }
    }

    return NextResponse.json<ApiSuccess<Skill>>({ data: newSkill }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating skill:', error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' } },
      { status: 500 }
    )
  }
}
