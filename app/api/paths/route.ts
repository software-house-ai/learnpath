import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiSuccess, ApiError } from "@/types/api"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    // Query paths with module counts
    const { data: paths, error } = await supabase
      .from("paths")
      .select(`
        id,
        title,
        status,
        estimated_completion_date,
        total_estimated_hours,
        goal:learning_goals(id, title, slug),
        modules:path_modules(id, status)
      `)
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })

    if (error) throw error

    // Compute completion percentage for each path
    const pathsWithProgress = paths.map((path: any) => {
      const totalModules = path.modules?.length || 0
      const completedModules = path.modules?.filter((m: any) => m.status === "completed").length || 0
      const completion_percent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
      
      return {
        id: path.id,
        title: path.title,
        status: path.status,
        goal: path.goal,
        completion_percent,
        estimated_completion_date: path.estimated_completion_date,
        total_estimated_hours: path.total_estimated_hours,
        module_count: totalModules,
        completed_module_count: completedModules
      }
    })

    return NextResponse.json<ApiSuccess<typeof pathsWithProgress>>({ data: pathsWithProgress })
  } catch (error) {
    console.error("Error fetching paths:", error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch paths" } },
      { status: 500 }
    )
  }
}
