/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PathHeader } from "@/components/paths/PathHeader"
import { RoadmapTimeline } from "@/components/paths/RoadmapTimeline"
import { RegeneratePathButton } from "@/components/paths/RegeneratePathButton"

export default async function RoadmapPage({ params }: { params: Promise<{ pathId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { pathId } = await params

  // Fetch full path detail
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
        estimated_weeks,
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
    .eq("id", pathId)
    .eq("user_id", user.id)
    .order("module_order", { foreignTable: "path_modules" })
    .order("order_in_module", { foreignTable: "path_modules.path_content_assignments" })
    .single()

  if (error || !path) {
    notFound()
  }

  const typedPath = path as any

  // Calculate completion percentage
  const totalModules = typedPath.modules.length
  const completedModules = typedPath.modules.filter((m: any) => m.status === "completed").length
  const completionPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  // Get user's learning hours per week
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_learning_goal_minutes")
    .eq("id", user.id)
    .single()

  const hoursPerWeek = profile?.daily_learning_goal_minutes 
    ? (profile.daily_learning_goal_minutes * 7) / 60 
    : 10

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PathHeader
        goalTitle={typedPath.goal.title}
        completionPercent={completionPercent}
        totalWeeks={typedPath.goal.estimated_weeks}
        estimatedCompletionDate={typedPath.estimated_completion_date}
        hoursPerWeek={hoursPerWeek}
      />

      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Domain: <span className="font-medium">{typedPath.goal?.domain?.name || 'Unknown'}</span>
          </p>
        </div>
        <RegeneratePathButton pathId={typedPath.id} />
      </div>

      <RoadmapTimeline pathId={typedPath.id} modules={typedPath.modules} />
    </div>
  )
}
