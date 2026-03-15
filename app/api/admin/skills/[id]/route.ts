import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiSuccess, ApiError, Skill } from '@/types/api'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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


    // Update the skill
    const { data: updatedSkill, error: updateError } = await supabase
      .from('skills')
      .update({
        name,
        slug,
        domain_id,
        description,
        difficulty,
        estimated_hours,
        is_published
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Step A: delete existing prerequisites for this skill
    const { error: deleteError } = await supabase
      .from('skill_prerequisites')
      .delete()
      .eq('skill_id', id)

    if (deleteError) throw new Error(deleteError.message)

    // Step B: insert new prerequisites if any
    if (prerequisites && Array.isArray(prerequisites) && prerequisites.length > 0) {
      const rows = prerequisites.map((prereqId: string) => ({
        skill_id: id,
        prerequisite_skill_id: prereqId,
        strength: 'required',
      }))
      const { error: insertError } = await supabase.from('skill_prerequisites').insert(rows)
      if (insertError) throw new Error(insertError.message)
    }

    return NextResponse.json<ApiSuccess<Skill>>({ data: updatedSkill })
  } catch (error: any) {
    console.error('Error updating skill:', error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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


    // Cleanup both directions of prerequisites
    const { error: prereqError } = await supabase
      .from('skill_prerequisites')
      .delete()
      .or(`skill_id.eq.${id},prerequisite_skill_id.eq.${id}`)

    if (prereqError) throw prereqError

    // Note: If you also have goal_skills referencing this skill, 
    // you likely need to cascade delete those too, or DB constraints will catch it
    const { error: goalSkillError } = await supabase
      .from('goal_skills')
      .delete()
      .eq('skill_id', id)
      
    if (goalSkillError) throw goalSkillError

    // Then delete from skills where id = id
    const { error: skillError } = await supabase
      .from('skills')
      .delete()
      .eq('id', id)

    if (skillError) throw skillError

    return NextResponse.json<ApiSuccess<{ deleted: boolean }>>({ data: { deleted: true } })
  } catch (error: any) {
    console.error('Error deleting skill:', error)
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' } },
      { status: 500 }
    )
  }
}