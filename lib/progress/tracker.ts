import type { SupabaseClient } from "@supabase/supabase-js"
import type { ProgressStatus, UserProgress } from "@/types/api"

type NoteItem = {
  timestamp_seconds: number
  note_text: string
  created_at: string
}

type UpdateProgressPayload = {
  content_item_id: string
  progress_percent: number
  last_position_seconds: number
  status?: ProgressStatus
  notes?: NoteItem[]
  path_module_id?: string
  time_spent_minutes?: number
}

export async function updateProgress(
  supabase: SupabaseClient,
  userId: string,
  payload: UpdateProgressPayload
): Promise<UserProgress> {
  const {
    content_item_id,
    progress_percent,
    last_position_seconds,
    status,
    notes,
    path_module_id,
    time_spent_minutes,
  } = payload

  let resolvedStatus: ProgressStatus
  let completed_at: string | undefined

  if (progress_percent >= 90 || status === "completed") {
    resolvedStatus = "completed"
    completed_at = new Date().toISOString()
  } else if (progress_percent > 0) {
    resolvedStatus = "in_progress"
  } else {
    resolvedStatus = status ?? "not_started"
  }

  const upsertData: Record<string, unknown> = {
    user_id: userId,
    content_item_id,
    progress_percent,
    last_position_seconds,
    status: resolvedStatus,
    ...(completed_at !== undefined && { completed_at }),
    ...(notes !== undefined && { notes }),
    ...(path_module_id !== undefined && { path_module_id }),
    ...(time_spent_minutes !== undefined && { time_spent_minutes }),
  }

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(upsertData, { onConflict: "user_id,content_item_id" })
    .select()
    .single()

  if (error) throw error
  return data as UserProgress
}

export async function checkModuleCompletion(
  supabase: SupabaseClient,
  userId: string,
  pathModuleId: string
): Promise<boolean> {
  // Step 1: Get all required content item ids for this module
  const { data: assignments, error: assignmentsError } = await supabase
    .from("path_content_assignments")
    .select("content_item_id")
    .eq("path_module_id", pathModuleId)
    .eq("is_required", true)

  if (assignmentsError) throw assignmentsError
  if (!assignments || assignments.length === 0) return false

  const requiredIds = (assignments as Array<{ content_item_id: string }>).map(
    (a) => a.content_item_id
  )

  // Step 2: Check how many required items have been completed
  const { data: completedProgress, error: progressError } = await supabase
    .from("user_progress")
    .select("content_item_id")
    .eq("user_id", userId)
    .in("content_item_id", requiredIds)
    .eq("status", "completed")

  if (progressError) throw progressError

  const allComplete =
    completedProgress !== null &&
    completedProgress.length === requiredIds.length

  if (!allComplete) return false

  // Step 3/4: Fetch module to check checkpoint status
  const { data: module, error: moduleError } = await supabase
    .from("path_modules")
    .select("id, path_id, module_order, checkpoint_passed")
    .eq("id", pathModuleId)
    .single()

  if (moduleError) throw moduleError

  if ((module as { checkpoint_passed: boolean }).checkpoint_passed) {
    // All content complete AND checkpoint passed → mark module completed
    await supabase
      .from("path_modules")
      .update({ status: "completed" })
      .eq("id", pathModuleId)

    // Unlock next module
    const { data: nextModule } = await supabase
      .from("path_modules")
      .select("id")
      .eq("path_id", (module as { path_id: string }).path_id)
      .eq("module_order", (module as { module_order: number }).module_order + 1)
      .single()

    if (nextModule) {
      await supabase
        .from("path_modules")
        .update({ status: "available" })
        .eq("id", (nextModule as { id: string }).id)
    }
  } else {
    // All content complete but checkpoint NOT yet passed → needs checkpoint
    await supabase
      .from("path_modules")
      .update({ status: "in_progress" })
      .eq("id", pathModuleId)
  }

  return true
}

export async function batchProgressUpdate(
  supabase: SupabaseClient,
  userId: string,
  updates: UpdateProgressPayload[]
): Promise<void> {
  for (const update of updates) {
    try {
      await updateProgress(supabase, userId, update)
    } catch (err) {
      console.error(
        `batchProgressUpdate: failed for content_item_id ${update.content_item_id}:`,
        err
      )
    }
  }
}
