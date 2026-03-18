import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStreakStatus } from "@/lib/progress/streak"

export async function GET() {
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

    // Step 3: Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_learning_goal_minutes, timezone")
      .eq("id", user.id)
      .single()

    const goalMinutesPerDay =
      (profile as { daily_learning_goal_minutes: number } | null)
        ?.daily_learning_goal_minutes ?? 30

    // Step 4: Fetch active paths
    const { data: activePaths } = await supabase
      .from("paths")
      .select(
        "id, goal_id, title, status, estimated_completion_date, total_estimated_hours"
      )
      .eq("user_id", user.id)
      .eq("status", "active")

    const paths = (activePaths ?? []) as Array<{
      id: string
      goal_id: string
      title: string
      status: string
      estimated_completion_date: string | null
      total_estimated_hours: number
    }>

    // Step 5: For each active path, compute completion and next content
    const enrichedPaths = await Promise.all(
      paths.map(async (path) => {
        const { count: totalModules } = await supabase
          .from("path_modules")
          .select("id", { count: "exact", head: true })
          .eq("path_id", path.id)

        const { count: completedModules } = await supabase
          .from("path_modules")
          .select("id", { count: "exact", head: true })
          .eq("path_id", path.id)
          .eq("status", "completed")

        const total = totalModules ?? 0
        const completed = completedModules ?? 0
        const completionPercent = total > 0 ? (completed / total) * 100 : 0

        // Find next module
        const { data: activeModules } = await supabase
          .from("path_modules")
          .select("id, title, status")
          .eq("path_id", path.id)
          .in("status", ["available", "in_progress"])
          .order("module_order", { ascending: true })

        let nextContent: {
          id: string
          title: string
          thumbnail_url: string | null
          duration_minutes: number | null
          module_title: string
          module_id: string
        } | null = null

        if (activeModules && activeModules.length > 0) {
          for (const mod of activeModules) {
            const { data: assignments } = await supabase
              .from("path_content_assignments")
              .select(`
                content_item_id,
                order_in_module,
                content_items (
                  id, title, thumbnail_url, duration_minutes
                )
              `)
              .eq("path_module_id", mod.id)
              .order("order_in_module", { ascending: true })

            if (!assignments || assignments.length === 0) {
              // Skip empty modules
              continue
            }

            const { data: progresses } = await supabase
              .from("user_progress")
              .select("content_item_id, status")
              .eq("user_id", user.id)
              .in("content_item_id", assignments.map((a: { content_item_id: string }) => a.content_item_id))

            const progressMap = new Map((progresses || []).map((p: { content_item_id: string, status: string }) => [p.content_item_id, p]))

            let nextAssignment = null
            for (const a of assignments) {
              const p = progressMap.get((a as { content_item_id: string }).content_item_id)
              if (!p || p.status !== "completed") {
                nextAssignment = a
                break
              }
            }

            // If all contents are completed but module is still active, point to the last item for checkpoint
            if (!nextAssignment && assignments.length > 0) {
               nextAssignment = assignments[assignments.length - 1]
            }

            if (nextAssignment && (nextAssignment as { content_items?: unknown }).content_items) {
              type ContentItemPayload = { id: string; title: string; thumbnail_url: string | null; duration_minutes: number | null }
              const rawItems = (nextAssignment as { content_items: ContentItemPayload | ContentItemPayload[] }).content_items
              const ci = Array.isArray(rawItems) ? rawItems[0] : rawItems
                
              nextContent = {
                id: ci.id,
                title: ci.title,
                thumbnail_url: ci.thumbnail_url,
                duration_minutes: ci.duration_minutes,
                module_title: mod.title,
                module_id: mod.id,
              }
              break
            }
          }
        }

        return {
          path_id: path.id,
          goal_title: path.title,
          status: path.status,
          completion_percent: Math.round(completionPercent * 100) / 100,
          estimated_completion_date: path.estimated_completion_date,
          next_content: nextContent,
        }
      })
    )

    // Step 6: Fetch streak
    const streak = await getStreakStatus(supabase, user.id)

    // Step 7: Fetch time this week
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: progressRows } = await supabase
      .from("user_progress")
      .select("time_spent_minutes")
      .eq("user_id", user.id)
      .gte("updated_at", weekAgo)

    const timeThisWeek = (
      (progressRows ?? []) as Array<{ time_spent_minutes: number }>
    ).reduce((sum, row) => sum + (row.time_spent_minutes ?? 0), 0)

    // Step 8: Fetch skill progress for each path
    const allSkillProgress: Array<{
      skill_name: string
      assessed_level: string
      modules_completed: number
      modules_total: number
    }> = []

    for (const path of paths) {
      const { data: pathModules } = await supabase
        .from("path_modules")
        .select("id, status, skill_id, skills(name)")
        .eq("path_id", path.id)

      if (!pathModules) continue

      const modules = (pathModules as unknown) as Array<{
        id: string
        status: string
        skill_id: string | null
        skills: { name: string } | null
      }>

      // Group by skill
      const skillMap = new Map<
        string,
        { name: string; total: number; completed: number }
      >()

      for (const mod of modules) {
        if (!mod.skill_id || !mod.skills || !mod.skills.name) continue
        const skillName = mod.skills.name
        const existing = skillMap.get(mod.skill_id) ?? {
          name: skillName,
          total: 0,
          completed: 0,
        }
        existing.total++
        if (mod.status === "completed") existing.completed++
        skillMap.set(mod.skill_id, existing)
      }

      if (skillMap.size === 0) continue

      const skillIds = Array.from(skillMap.keys())
      const { data: assessments } = await supabase
        .from("skill_assessments")
        .select("skill_id, assessed_level")
        .eq("user_id", user.id)
        .in("skill_id", skillIds)

      const assessmentMap = new Map<string, string>(
        ((assessments ?? []) as Array<{
          skill_id: string
          assessed_level: string
        }>).map((a) => [a.skill_id, a.assessed_level])
      )

      for (const [skillId, info] of skillMap.entries()) {
        allSkillProgress.push({
          skill_name: info.name,
          assessed_level: assessmentMap.get(skillId) ?? "not_started",
          modules_completed: info.completed,
          modules_total: info.total,
        })
      }
    }

    // Step 9: Return full dashboard payload
    return NextResponse.json({
      data: {
        active_paths: enrichedPaths,
        streak,
        time_this_week: timeThisWeek,
        goal_minutes_per_day: goalMinutesPerDay,
        skill_progress: allSkillProgress,
      },
    })
  } catch (err) {
    console.error("GET /api/user/dashboard error:", err)
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
