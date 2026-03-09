import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiSuccess, ApiError, Profile } from "@/types/api"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      return NextResponse.json<ApiError>(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiSuccess<Profile>>({ data: profile as Profile })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const body = (await request.json()) as {
      full_name?: string
      daily_learning_goal_minutes?: number
      timezone?: string
    }

    if (
      body.daily_learning_goal_minutes !== undefined &&
      (body.daily_learning_goal_minutes < 5 || body.daily_learning_goal_minutes > 480)
    ) {
      return NextResponse.json<ApiError>(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "daily_learning_goal_minutes must be between 5 and 480",
          },
        },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.full_name !== undefined) updateData.full_name = body.full_name
    if (body.daily_learning_goal_minutes !== undefined)
      updateData.daily_learning_goal_minutes = body.daily_learning_goal_minutes
    if (body.timezone !== undefined) updateData.timezone = body.timezone

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json<ApiError>(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiSuccess<Profile>>({ data: profile as Profile })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
