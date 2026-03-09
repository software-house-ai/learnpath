import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
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
    const body = await request.json()
    const { rating, comment } = body

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_RATING",
            message: "rating must be an integer between 1 and 5",
          },
        },
        { status: 400 }
      )
    }

    const { data: progress } = await supabase
      .from("user_progress")
      .select("status")
      .eq("user_id", user.id)
      .eq("content_item_id", id)
      .single()

    if (!progress || (progress as { status: string }).status !== "completed") {
      return NextResponse.json(
        {
          error: {
            code: "NOT_COMPLETED",
            message: "Complete this content before rating",
          },
        },
        { status: 403 }
      )
    }

    const { error: upsertError } = await supabase
      .from("content_ratings")
      .upsert(
        {
          user_id: user.id,
          content_item_id: id,
          rating,
          ...(comment !== undefined && { comment }),
          rated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_item_id" }
      )

    if (upsertError) throw upsertError

    const { error: rpcError } = await supabase.rpc("update_content_rating", {
      content_id: id,
    })

    if (rpcError) throw rpcError

    return NextResponse.json({
      data: { rated: true, rating },
    })
  } catch (err) {
    console.error("POST /api/content/[id]/rate error:", err)
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
