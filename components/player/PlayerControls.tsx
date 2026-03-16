"use client"
import { useRouter } from "next/navigation"

interface PlayerControlsProps {
  pathId: string
  moduleId: string
  contentId: string
  moduleTitle: string
  contentTitle: string
  currentIndex: number
  totalInModule: number
  prevContentId: string | null
  nextContentId: string | null
  onComplete?: () => void
}

export default function PlayerControls({
  pathId,
  moduleId,
  contentId,
  moduleTitle,
  contentTitle,
  currentIndex,
  totalInModule,
  prevContentId,
  nextContentId,
  onComplete
}: PlayerControlsProps) {
  const router = useRouter()
  const prevHref = prevContentId ? `/paths/${pathId}/learn/${moduleId}/${prevContentId}` : null
  const nextHref = nextContentId ? `/paths/${pathId}/learn/${moduleId}/${nextContentId}` : null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between z-50">
      <button
        disabled={!prevContentId}
        onClick={() => prevHref && router.push(prevHref)}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200"
      >
        ← Previous
      </button>
      <div className="text-center">
        <p className="text-xs text-gray-500">{moduleTitle}</p>
        <p className="text-sm font-medium text-gray-900">{contentTitle}</p>
        <p className="text-xs text-gray-400">{currentIndex} of {totalInModule}</p>
      </div>
      <button
        disabled={!nextContentId}
        onClick={() => nextHref && router.push(nextHref)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50 hover:bg-blue-700"
      >
        Next →
      </button>
    </div>
  )
}
