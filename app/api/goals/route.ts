import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiError, ApiSuccess, LearningGoal, Domain } from "@/types/api"

type GoalWithDomain = LearningGoal &
  Pick<Domain, "color_hex" | "icon_name"> & {
    domain_name: string
  }

type RawGoalRow = LearningGoal & {
  domains: Pick<Domain, "name" | "color_hex" | "icon_name"> | null
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("learning_goals")
      .select(
        `
        *,
        domains (
          name,
          color_hex,
          icon_name
        )
      `
      )
      .eq("is_published", true)
      .order("display_order", { ascending: true })

    if (error) {
      return NextResponse.json<ApiError>(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      )
    }

    const goals: GoalWithDomain[] = ((data ?? []) as RawGoalRow[]).map(
      ({ domains, ...rest }) => ({
        ...rest,
        domain_name: domains?.name ?? "",
        color_hex: domains?.color_hex ?? "",
        icon_name: domains?.icon_name ?? null,
      })
    )

    return NextResponse.json<ApiSuccess<GoalWithDomain[]>>(
      { data: goals },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
