import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ApiError } from "@/types/api"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const domain = searchParams.get("domain")
    const difficulty = searchParams.get("difficulty")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")

    let query = supabase
      .from("skills")
      .select("id, name, slug, difficulty, estimated_hours, description, domains(name, slug)", { count: "exact" })
      .eq("is_published", true)
      .range((page - 1) * limit, page * limit - 1)

    if (domain) query = query.eq("domains.slug", domain)
    if (difficulty) query = query.eq("difficulty", parseInt(difficulty))
    if (search) query = query.ilike("name", `%${search}%`)

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json<ApiError>(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data, meta: { total: count ?? 0, page } },
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
