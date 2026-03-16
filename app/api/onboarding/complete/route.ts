import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generatePath } from "@/lib/path-engine"
import type { PathInput } from "@/lib/path-engine/types"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not logged in" } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { goal_id, assessment_results, context } = body

    if (!goal_id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "goal_id is required" } },
        { status: 400 }
      )
    }

    // Call the Path Engine to generate the personalized path based on user's assessment
    const pathInput: PathInput = {
      user_id: user.id,
      goal_id,
      assessment_results: assessment_results || {},
      context: {
        hours_per_week: context?.hours_per_week || 7,
        deadline: context?.deadline || null,
        reason: context?.reason || ""
      }
    }

    const pathOutput = await generatePath(pathInput)

    return NextResponse.json({ 
      data: {
        path: pathOutput
      } 
    })
  } catch (error: unknown) {
    console.error("Path Generation Error:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Failed to generate path" } },
      { status: 500 }
    )
  }
}