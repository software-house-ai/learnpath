import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get goals with their target skills
    const { data: goals, error } = await supabase
      .from('learning_goals')
      .select(`
        *,
        goal_skills (
          skills (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform data to flatten skills
    const transformedGoals = goals.map(goal => ({
      ...goal,
      skills: goal.goal_skills.map((gs: { skills: unknown }) => gs.skills)
    }))

    return NextResponse.json({ data: transformedGoals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, is_published, skills } = body

    // Slugification (simple version)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

    // Insert main goal
    const { data: goal, error: goalError } = await supabase
      .from('learning_goals')
      .insert({
        title,
        slug,
        description,
        is_published: is_published ?? false
      })
      .select()
      .single()

    if (goalError) throw goalError

    // Insert target skills if any
    if (skills && skills.length > 0) {
      const targetSkillsData = skills.map((skillId: string) => ({
        goal_id: goal.id,
        skill_id: skillId
      }))

      const { error: skillsError } = await supabase
        .from('goal_skills')
        .insert(targetSkillsData)

      if (skillsError) throw skillsError
    }

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
