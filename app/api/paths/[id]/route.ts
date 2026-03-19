/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiSuccess, ApiError } from "@/types/api"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15, route segment params should be awaited if we want to use them properly, but Next 14 handles it fine. Let's use standard Promise wrapper just in case depending on the precise version. I'll use standard param typing as specified by the prompt. Note: NextJS 14 supports standard params.
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

    // Fetch full path with nested data
    const { data: path, error } = await supabase
      .from("paths")
      .select(`
        id,
        title,
        status,
        total_estimated_hours,
        estimated_completion_date,
        goal:learning_goals(
          title,
          slug,
          domain:domains(name, slug)
        ),
        modules:path_modules(
          id,
          module_order,
          week_number,
          status,
          checkpoint_passed,
          unlock_condition,
          skill:skills(
            name,
            slug,
            estimated_hours
          ),
          content_assignments:path_content_assignments(
            id,
            order_in_module,
            is_required,
            content_item:content_items(
              id,
              title,
              content_type,
              duration_minutes,
              provider,
              url,
              thumbnail_url
            )
          )
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .order("module_order", { foreignTable: "path_modules" })
      .order("order_in_module", { foreignTable: "path_modules.path_content_assignments" })
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json<ApiError>(
          { error: { code: "NOT_FOUND", message: "Path not found" } },
          { status: 404 }
        )
      }
      throw error
    }

    // Fetch user progress for all content items in this path
    const contentItemIds = path.modules.flatMap((m: any) => 
      m.content_assignments.map((ca: any) => ca.content_item.id)
    )

    const { data: progressData } = await supabase
      .from("user_progress")
      .select("content_item_id, status, progress_percent, time_spent_minutes")
      .eq("user_id", user.id)
      .in("content_item_id", contentItemIds)

    // Create progress lookup map
    const progressMap = new Map(
      progressData?.map(p => [p.content_item_id, p]) || []
    )

    // Attach progress to content items
    const pathWithProgress = {
      ...path,
      modules: path.modules.map((module: any) => ({
        ...module,
        content_assignments: module.content_assignments.map((ca: any) => ({
          ...ca,
          content_item: {
            ...ca.content_item,
            user_progress: progressMap.get(ca.content_item.id) || null
          }
        }))
      }))
    }

    return NextResponse.json<ApiSuccess<typeof pathWithProgress>>({ 
      data: pathWithProgress 
    })
  } catch (error) {
    console.error("Error fetching path detail:", error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch path" } },
      { status: 500 }
    )
  }
}