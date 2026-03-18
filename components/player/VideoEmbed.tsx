"use client"
import { useEffect, useState } from "react"

interface VideoEmbedProps {
  embedUrl: string
  _contentItemId?: string
  durationMinutes: number
  initialPositionSeconds: number
  onProgressUpdate: (percent: number, seconds: number) => void
  onMarkComplete: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function VideoEmbed({
  embedUrl,
  durationMinutes,
  initialPositionSeconds,
  onProgressUpdate,
  onMarkComplete
}: VideoEmbedProps) {
  const [secondsWatched, setSecondsWatched] = useState(initialPositionSeconds)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(document.visibilityState === "visible")
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (!isActive) return
    const timer = setInterval(() => {
      setSecondsWatched((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isActive])

  useEffect(() => {
    if (secondsWatched > initialPositionSeconds && secondsWatched % 30 === 0) {
      const totalSeconds = (durationMinutes || 10) * 60
      const percent = Math.min((secondsWatched / totalSeconds) * 100, 100)
      onProgressUpdate(percent, secondsWatched)
    }
  }, [secondsWatched, durationMinutes, onProgressUpdate, initialPositionSeconds])

  const handleMarkComplete = () => {
    onProgressUpdate(100, secondsWatched)
    onMarkComplete()
  }

  const iframeSrc = `${embedUrl}?start=${initialPositionSeconds}&rel=0&modestbranding=1`

  return (
    <div>
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={iframeSrc}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>
      <div className="flex justify-between items-center mt-3">
        <span className="text-sm text-gray-500">{formatTime(secondsWatched)} watched</span>
        <button
          onClick={handleMarkComplete}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          ✓ Mark as Complete
        </button>
      </div>
    </div>
  )
}
