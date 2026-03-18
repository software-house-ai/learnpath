import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ApiError } from "@/types/api"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data: skill, error } = await supabase
      .from("skills")
      .select(`
        id, name, slug, description, difficulty, estimated_hours,
        domains(name, slug),
        content_items(id, title, content_type, url, provider, difficulty_level, duration_minutes, rating_avg, is_active),
        skill_prerequisites!skill_id(
          prerequisite_skill_id,
          strength,
          skills!prerequisite_skill_id(id, name, slug)
        )
      `)
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (error || !skill) {
      return NextResponse.json<ApiError>(
        { error: { code: "NOT_FOUND", message: "Skill not found" } },
        { status: 404 }
      )
    }

    // Fetch learning goals that include this skill
    const { data: goalsData } = await supabase
      .from("goal_skills")
      .select("learning_goals(id, title, slug, difficulty)")
      .eq("skill_id", skill.id)

    return NextResponse.json(
      { data: { ...skill, related_goals: goalsData ?? [] } },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
