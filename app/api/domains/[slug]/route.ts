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

    const { data: domain, error } = await supabase
      .from("domains")
      .select(`
        id, name, slug, description, icon_name, color_hex,
        skills(id, name, slug, difficulty, estimated_hours, is_published),
        learning_goals(id, title, slug, difficulty, estimated_weeks, is_published)
      `)
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (error || !domain) {
      return NextResponse.json<ApiError>(
        { error: { code: "NOT_FOUND", message: "Domain not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { data: domain },
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
