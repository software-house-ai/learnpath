import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ApiSuccess, ApiError } from "@/types/api"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> }
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

    const body = await request.json()
    const { action } = body // "skip" | "unskip"
    const { id, mid } = await params

    // Verify path ownership
    const { data: path } = await supabase
      .from("paths")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!path) {
      return NextResponse.json<ApiError>(
        { error: { code: "NOT_FOUND", message: "Path not found" } },
        { status: 404 }
      )
    }

    // Get current module status
    const { data: module } = await supabase
      .from("path_modules")
      .select("status")
      .eq("id", mid)
      .eq("path_id", id)
      .single()

    if (!module) {
      return NextResponse.json<ApiError>(
        { error: { code: "NOT_FOUND", message: "Module not found" } },
        { status: 404 }
      )
    }

    let newStatus: string

    if (action === "skip") {
      // Can only skip if module is available or in_progress
      if (module.status !== "available" && module.status !== "in_progress") {
        return NextResponse.json<ApiError>(
          { error: { code: "INVALID_ACTION", message: "Can only skip available modules" } },
          { status: 400 }
        )
      }
      newStatus = "skipped"
    } else if (action === "unskip") {
      // Can only unskip if currently skipped
      if (module.status !== "skipped") {
        return NextResponse.json<ApiError>(
          { error: { code: "INVALID_ACTION", message: "Module is not skipped" } },
          { status: 400 }
        )
      }
      newStatus = "available"
    } else {
      return NextResponse.json<ApiError>(
        { error: { code: "INVALID_ACTION", message: "Invalid action" } },
        { status: 400 }
      )
    }

    // Update module status
    const { data: updated, error } = await supabase
      .from("path_modules")
      .update({ status: newStatus })
      .eq("id", mid)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json<ApiSuccess<typeof updated>>({ data: updated })
  } catch (error) {
    console.error("Error updating module:", error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update module" } },
      { status: 500 }
    )
  }
}
