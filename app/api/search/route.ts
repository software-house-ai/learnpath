import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiSuccess, ApiError } from "@/types/api"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json<ApiError>(
        { error: { code: "INVALID_QUERY", message: "Search query must be at least 2 characters" } },
        { status: 400 }
      )
    }

    // Search across goals, skills, and content in parallel
    const [goalsResult, skillsResult, contentResult] = await Promise.all([
      // Search learning goals
      supabase
        .from("learning_goals")
        .select(`
          id,
          title,
          slug,
          description,
          difficulty,
          estimated_weeks,
          domain:domains(name, slug, color_hex)
        `)
        .eq("is_published", true)
        .textSearch("search_vector", query, {
          type: "websearch",
          config: "english"
        })
        .limit(10),

      // Search skills
      supabase
        .from("skills")
        .select(`
          id,
          name,
          slug,
          description,
          difficulty,
          estimated_hours,
          domain:domains(name, slug, color_hex)
        `)
        .eq("is_published", true)
        .textSearch("search_vector", query, {
          type: "websearch",
          config: "english"
        })
        .limit(15),

      // Search content items
      supabase
        .from("content_items")
        .select(`
          id,
          title,
          description,
          content_type,
          provider,
          duration_minutes,
          difficulty_level,
          thumbnail_url,
          rating_avg,
          skill:skills(
            name,
            slug,
            domain:domains(name, color_hex)
          )
        `)
        .eq("is_active", true)
        .textSearch("search_vector", query, {
          type: "websearch",
          config: "english"
        })
        .limit(20)
    ])

    // Check for errors
    if (goalsResult.error) throw goalsResult.error
    if (skillsResult.error) throw skillsResult.error
    if (contentResult.error) throw contentResult.error

    const results = {
      goals: goalsResult.data || [],
      skills: skillsResult.data || [],
      content: contentResult.data || [],
      total: (goalsResult.data?.length || 0) + (skillsResult.data?.length || 0) + (contentResult.data?.length || 0)
    }

    return NextResponse.json<ApiSuccess<typeof results>>({
      data: results,
      meta: {
        query,
        total: results.total
      }
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Search failed" } },
      { status: 500 }
    )
  }
}
