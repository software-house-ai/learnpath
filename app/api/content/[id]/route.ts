import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      )
    }

    const { id } = await params

    const { data: contentItem, error: contentError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single()

    if (contentError || !contentItem) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Content item not found",
          },
        },
        { status: 404 }
      )
    }

    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("content_item_id", id)
      .single()

    return NextResponse.json(
      {
        data: {
          ...contentItem,
          user_progress: userProgress ?? null,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=1800",
        },
      }
    )
  } catch (err) {
    console.error("GET /api/content/[id] error:", err)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    )
  }
}
