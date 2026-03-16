import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, is_published, skills } = body
    
    // Update main goal
    const { data: goal, error: goalError } = await supabase
      .from('learning_goals')
      .update({
        title,
        description,
        is_published,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (goalError) throw goalError

    // Handle target skills update if provided
    if (skills !== undefined) {
      // First delete existing skills for this goal
      const { error: deleteError } = await supabase
        .from('goal_skills')
        .delete()
        .eq('goal_id', id)
        
      if (deleteError) throw deleteError

      // Insert new skills if any
      if (skills.length > 0) {
        const skillsData = skills.map((skillId: string) => ({
          goal_id: id,
          skill_id: skillId
        }))

        const { error: insertError } = await supabase
          .from('goal_skills')
          .insert(skillsData)

        if (insertError) throw insertError
      }
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Goal_skills should have ON DELETE CASCADE setup in DB, 
    // but manually deleting just in case to be safe
    await supabase
      .from('goal_skills')
      .delete()
      .eq('goal_id', id)

    const { error } = await supabase
      .from('learning_goals')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}