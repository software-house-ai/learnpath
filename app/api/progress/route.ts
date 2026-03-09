import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updateProgress, checkModuleCompletion } from "@/lib/progress/tracker"
import { updateStreak, getStreakStatus } from "@/lib/progress/streak"
import type { ProgressStatus } from "@/types/api"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      content_item_id,
      progress_percent,
      last_position_seconds,
      status,
      notes,
      path_module_id,
      time_spent_minutes,
    } = body

    if (!content_item_id) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_FIELD",
            message: "content_item_id is required",
          },
        },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split("T")[0]
    const prevStreak = await getStreakStatus(supabase, user.id)
    const streakWasAlreadyUpdatedToday =
      prevStreak.last_activity_date === today

    const updatedRow = await updateProgress(supabase, user.id, {
      content_item_id,
      progress_percent,
      last_position_seconds,
      status: status as ProgressStatus | undefined,
      notes,
      path_module_id,
      time_spent_minutes,
    })

    if (path_module_id) {
      await checkModuleCompletion(supabase, user.id, path_module_id)
    }

    await updateStreak(supabase, user.id)
    const streakStatus = await getStreakStatus(supabase, user.id)

    return NextResponse.json({
      data: {
        progress: updatedRow,
        streak: streakStatus,
        streak_updated: !streakWasAlreadyUpdatedToday,
      },
    })
  } catch (err) {
    console.error("POST /api/progress error:", err)
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
