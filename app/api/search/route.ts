import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ApiError } from "@/types/api"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const q = searchParams.get("q") ?? ""

    if (!q || q.length < 2) {
      return NextResponse.json<ApiError>(
        { error: { code: "INVALID_QUERY", message: "Search query must be at least 2 characters" } },
        { status: 400 }
      )
    }

    const [skillsResult, goalsResult, contentResult] = await Promise.all([
      supabase
        .from("skills")
        .select("id, name, slug, difficulty, domains(name, slug)")
        .eq("is_published", true)
        .ilike("name", `%${q}%`)
        .limit(10),

      supabase
        .from("learning_goals")
        .select("id, title, slug, difficulty, estimated_weeks, domains(name, slug)")
        .eq("is_published", true)
        .ilike("title", `%${q}%`)
        .limit(10),

      supabase
        .from("content_items")
        .select("id, title, content_type, provider, difficulty_level, url, skills(name, slug)")
        .eq("is_active", true)
        .ilike("title", `%${q}%`)
        .limit(10),
    ])

    return NextResponse.json({
      data: {
        skills: skillsResult.data ?? [],
        goals: goalsResult.data ?? [],
        content: contentResult.data ?? [],
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
