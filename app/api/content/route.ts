import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiSuccess, ApiError } from "@/types/api"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const skillSlug = searchParams.get("skill_slug")
    const contentType = searchParams.get("content_type")
    const difficultyLevel = searchParams.get("difficulty_level")
    const language = searchParams.get("language") || "en"
    const provider = searchParams.get("provider")
    const searchQuery = searchParams.get("q")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Build base query with count
    let query = supabase
      .from("content_items")
      .select(`
        id,
        title,
        description,
        content_type,
        url,
        embed_url,
        provider,
        author_name,
        duration_minutes,
        difficulty_level,
        thumbnail_url,
        rating_avg,
        completion_rate,
        language,
        created_at,
        skill:skills!inner(
          id,
          name,
          slug,
          domain:domains(name, slug, color_hex)
        )
      `, { count: "exact" })
      .eq("is_active", true)

    // Apply filters
    if (skillSlug) {
      query = query.eq("skill.slug", skillSlug)
    }

    if (contentType) {
      query = query.eq("content_type", contentType)
    }

    if (difficultyLevel) {
      query = query.eq("difficulty_level", difficultyLevel)
    }

    if (language) {
      query = query.eq("language", language)
    }

    if (provider) {
      query = query.eq("provider", provider)
    }

    // Full text search if query provided
    if (searchQuery) {
      query = query.textSearch("search_vector", searchQuery, {
        type: "websearch",
        config: "english"
      })
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Execute query with pagination and sorting
    const { data: content, error, count } = await query
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json<ApiSuccess<typeof content>>({
      data: content || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages
      }
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800"
      }
    })
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch content" } },
      { status: 500 }
    )
  }
}
