import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { evaluateCheckpoint } from "@/lib/progress/checkpoint"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
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

    const { moduleId } = await params

    const body = await request.json()
    const { answers } = body

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "answers must be a non-empty array",
          },
        },
        { status: 400 }
      )
    }

    const result = await evaluateCheckpoint(
      supabase,
      user.id,
      moduleId,
      answers
    )

    return NextResponse.json({
      data: {
        score_percent: result.score_percent,
        passed: result.passed,
        correct_count: result.correct_count,
        total: result.total,
        explanation_per_question: result.explanation_per_question,
      },
    })
  } catch (err) {
    console.error("POST /api/checkpoint/[moduleId] error:", err)
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
