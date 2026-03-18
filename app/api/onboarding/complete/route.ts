import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ApiSuccess, ApiError, AssessedLevel } from "@/types/api"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { goal_id, assessment_results, context } = body

    if (!goal_id || !context) {
      return NextResponse.json<ApiError>(
        { error: { code: "BAD_REQUEST", message: "goal_id and context are required" } },
        { status: 400 }
      )
    }

    // Step 1: Save context to profiles table
    const dailyMinutes = Math.round((context.hours_per_week / 7) * 60)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        learning_context: {
          hours_per_week: context.hours_per_week,
          deadline: context.deadline,
          reason: context.reason
        },
        daily_learning_goal_minutes: dailyMinutes
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      throw new Error("Failed to save learning context")
    }

    // Step 2: Upsert assessment results
    if (assessment_results && Object.keys(assessment_results).length > 0) {
      const typedAssessmentResults = assessment_results as Record<string, AssessedLevel>
      const assessmentData = Object.entries(typedAssessmentResults).map(
        ([skill_id, level]: [string, AssessedLevel]) => ({
          user_id: user.id,
          skill_id,
          assessed_level: level as AssessedLevel,
          assessment_method: "ai_quiz" as const,
          confidence_score: 0.8,
          assessed_at: new Date().toISOString()
        })
      )

      const { error: assessmentError } = await supabase
        .from("skill_assessments")
        .upsert(assessmentData, { onConflict: "user_id,skill_id" })

      if (assessmentError) {
        console.error("Assessment upsert error:", assessmentError)
        throw new Error("Failed to save assessment results")
      }
    }

    // Step 3: Call path generation (non-fatal if it fails)
    let path_id: string | null = null
    try {
      const { generatePath } = await import("@/lib/path-engine/index")
      const pathOutput = await generatePath({
        user_id: user.id,
        goal_id,
        assessment_results: assessment_results || {},
        context: {
          hours_per_week: context.hours_per_week,
          deadline: context.deadline,
          reason: context.reason || ""
        }
      })
      path_id = pathOutput.path_id || null
    } catch (pathError) {
      console.error("Path generation failed but assessment data saved:", pathError)
      // Do NOT rethrow — assessment is already saved
    }

    return NextResponse.json<
      ApiSuccess<{
        path_id: string | null
        redirect_url: string
      }>
    >({
      data: {
        path_id,
        redirect_url: path_id ? `/paths/${path_id}/learn` : "/dashboard"
      }
    })
  } catch (error: unknown) {
    console.error("Onboarding Error:", error)
    return NextResponse.json<ApiError>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Something went wrong"
        }
      },
      { status: 500 }
    )
  }
}