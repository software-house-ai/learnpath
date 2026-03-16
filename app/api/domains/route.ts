import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ApiError } from "@/types/api"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("domains")
      .select("id, name, slug, description, icon_name, color_hex, display_order")
      .eq("is_published", true)
      .order("display_order")

    if (error) {
      return NextResponse.json<ApiError>(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
