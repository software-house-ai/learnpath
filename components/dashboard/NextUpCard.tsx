"use client"
import Link from "next/link"

interface DashboardData {
  active_paths: Array<{
    next_content: {
      id: string
      title: string
      thumbnail_url: string | null
      duration_minutes: number | null
      module_title: string
    } | null
  }>
}

interface NextUpCardProps {
  nextContent: DashboardData["active_paths"][0]["next_content"]
  pathId: string
  moduleId?: string
}

export function NextUpCard({ nextContent, pathId, moduleId }: NextUpCardProps) {
  if (!nextContent) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p className="text-gray-500">🎉 You&apos;re all caught up! Check your paths for more content.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Up Next</p>
      <div className="flex gap-4 items-start">
        {nextContent.thumbnail_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nextContent.thumbnail_url} className="w-24 h-16 rounded object-cover" alt="Thumbnail" />
          </>
        )}
        <div className="flex-1">
          <p className="text-xs text-blue-600 mb-1">{nextContent.module_title}</p>
          <h3 className="font-semibold text-gray-900 mb-1">{nextContent.title}</h3>
          {nextContent.duration_minutes && (
            <p className="text-sm text-gray-500">{nextContent.duration_minutes} min</p>
          )}
        </div>
      </div>
      <Link
        href={`/paths/${pathId}/learn/${moduleId || 'module'}/${nextContent.id}`}
        className="mt-4 w-full block text-center bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
      >
        Start Learning →
      </Link>
    </div>
  )
}
