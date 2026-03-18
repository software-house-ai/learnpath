import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { assessmentSessions } from "../sessions"
import type { ApiSuccess, ApiError, AssessedLevel } from "@/types/api"

interface AssessmentResult {
  assessed_level: AssessedLevel
  confidence_score: number
  responses?: Record<string, unknown>[]
}

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
    const { session_id, results } = body

    // Validate session
    const session = assessmentSessions.get(session_id)
    if (!session) {
      return NextResponse.json<ApiError>(
        { error: { code: "BAD_REQUEST", message: "Session not found" } },
        { status: 400 }
      )
    }

    if (session.user_id !== user.id) {
      return NextResponse.json<ApiError>(
        { error: { code: "FORBIDDEN", message: "Session does not belong to user" } },
        { status: 403 }
      )
    }

    // Upsert all assessment results
    const assessmentData = Object.entries(results as Record<string, AssessmentResult>).map(([skill_id, result]) => ({
      user_id: user.id,
      skill_id,
      assessed_level: result.assessed_level as AssessedLevel,
      assessment_method: "ai_quiz" as const,
      confidence_score: result.confidence_score || 0.75,
      raw_responses: (result.responses as Record<string, unknown>[]) || [],
      assessed_at: new Date().toISOString()
    }))

    const { error: upsertError } = await supabase
      .from("skill_assessments")
      .upsert(assessmentData, { onConflict: "user_id,skill_id" })

    if (upsertError) {
      throw upsertError
    }

    // Clean up session
    assessmentSessions.delete(session_id)

    return NextResponse.json<
      ApiSuccess<{
        saved_count: number
        skill_map: Record<string, AssessmentResult>
      }>
    >({
      data: {
        saved_count: Object.keys(results).length,
        skill_map: results
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
