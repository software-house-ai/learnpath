"use client"

interface PathCardProps {
  pathId: string
  goalTitle: string
  completionPercent: number
  estimatedCompletionDate: string | null
  nextContentId: string | null
  nextModuleId: string | null
  nextPathId: string | null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function PathCard({
  goalTitle,
  completionPercent,
  estimatedCompletionDate,
}: PathCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-2">{goalTitle}</h3>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionPercent}%` }} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{Math.round(completionPercent)}% complete</span>
        {estimatedCompletionDate && (
          <span className="text-xs text-gray-400">Est. {formatDate(estimatedCompletionDate)}</span>
        )}
      </div>
    </div>
  )
}

