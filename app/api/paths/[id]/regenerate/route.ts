/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiSuccess, ApiError } from "@/types/api"
import { generatePath } from "@/lib/path-engine"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get existing path to get goal_id
    const { data: existingPath } = await supabase
      .from("paths")
      .select("goal_id, user_id")
      .eq("id", id)
      .single()

    if (!existingPath || existingPath.user_id !== user.id) {
      return NextResponse.json<ApiError>(
        { error: { code: "NOT_FOUND", message: "Path not found" } },
        { status: 404 }
      )
    }

    // Load latest skill assessments
    const { data: assessments } = await supabase
      .from("skill_assessments")
      .select("skill_id, assessed_level")
      .eq("user_id", user.id)

    const assessmentResults = assessments?.reduce((acc: Record<string, import("@/types/api").AssessedLevel>, a) => {
      acc[a.skill_id] = a.assessed_level as import("@/types/api").AssessedLevel
      return acc
    }, {}) || {}

    // Load user context
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_learning_goal_minutes, learning_context")
      .eq("id", user.id)
      .single()

    const hoursPerWeek = profile?.daily_learning_goal_minutes 
      ? (profile.daily_learning_goal_minutes * 7) / 60 
      : 7

    // Archive old path
    console.log("Archiving old path:", id)
    const { error: updateError } = await supabase
      .from("paths")
      .update({ status: "abandoned" })
      .eq("id", id)
      
    if (updateError) {
      console.error("Failed to archive path:", updateError)
    }

    // Generate new path
    console.log("Generating new path for user:", user.id)
    const result = await generatePath({
      user_id: user.id,
      goal_id: existingPath.goal_id,
      assessment_results: assessmentResults,
      context: {
        hours_per_week: hoursPerWeek,
        deadline: (profile?.learning_context as any)?.deadline || null,
        reason: (profile?.learning_context as any)?.reason || "personal_growth"
      }
    })

    return NextResponse.json<ApiSuccess<typeof result>>({ data: result })
  } catch (error) {
    console.error("Error regenerating path:", error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Failed to regenerate path" } },
      { status: 500 }
    )
  }
}
