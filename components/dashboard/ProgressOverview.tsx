"use client"
import Link from "next/link"
import PathCard from "./PathCard"

interface DashboardData {
  active_paths: Array<{
    path_id: string
    goal_title: string
    status: string
    completion_percent: number
    estimated_completion_date: string | null
    next_content: {
      id: string
      title: string
      thumbnail_url: string | null
      duration_minutes: number | null
      module_title: string
    } | null
  }>
}

interface ProgressOverviewProps {
  paths: DashboardData["active_paths"]
}

export function ProgressOverview({ paths }: ProgressOverviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">My Learning Paths</h2>
      {paths.length === 0 && (
        <p className="text-gray-500">No active paths. Start learning to see progress here.</p>
      )}
      {paths.map(path => (
        <div key={path.path_id}>
          <PathCard
            pathId={path.path_id}
            goalTitle={path.goal_title}
            completionPercent={path.completion_percent}
            estimatedCompletionDate={path.estimated_completion_date}
            nextContentId={path.next_content?.id || null}
            nextModuleId={null}
            nextPathId={path.path_id}
          />
          {path.next_content && (
            <Link
              href={`/paths/${path.path_id}/learn`}
              className="mt-2 inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg"
            >
              Continue →
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
