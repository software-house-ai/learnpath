import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ApiError } from "@/types/api"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const skillSlug = searchParams.get("skill_slug")
    const contentType = searchParams.get("content_type")
    const difficulty = searchParams.get("difficulty_level")
    const language = searchParams.get("language")
    const provider = searchParams.get("provider")
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")

    let query = supabase
      .from("content_items")
      .select("*, skills(name, slug)", { count: "exact" })
      .eq("is_active", true)
      .order("rating_avg", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (skillSlug) query = query.eq("skills.slug", skillSlug)
    if (contentType) query = query.eq("content_type", contentType)
    if (difficulty) query = query.eq("difficulty_level", difficulty)
    if (language) query = query.eq("language", language)
    if (provider) query = query.ilike("provider", `%${provider}%`)

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json<ApiError>(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data, meta: { total: count ?? 0, page } },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
