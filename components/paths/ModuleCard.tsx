"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Lock, CheckCircle, Clock, Play, LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ModuleStatus } from "@/types/api"

interface ContentItem {
  id: string
  title: string
  content_type: string
  duration_minutes: number
  provider: string
  user_progress?: {
    status: string
    progress_percent: number
  } | null
}

interface ModuleCardProps {
  id: string
  skillName: string
  status: ModuleStatus
  estimatedHours: number
  contentCount: number
  contentItems: ContentItem[]
  unlockCondition?: { requires: string[] } | null
  checkpointPassed: boolean
  onSkip?: () => void
  onStart?: () => void
}

export function ModuleCard({
  skillName,
  status,
  estimatedHours,
  contentCount,
  contentItems,
  unlockCondition,
  checkpointPassed,
  onSkip,
  onStart
}: ModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isLocked = status === "locked"
  const isSkipped = status === "skipped"
  const isAvailable = status === "available" || status === "in_progress"

  const statusConfig: Record<ModuleStatus, { color: string; icon: LucideIcon }> = {
    locked: { color: "bg-gray-200 text-gray-600", icon: Lock },
    available: { color: "bg-blue-100 text-blue-700", icon: Play },
    in_progress: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
    completed: { color: "bg-green-100 text-green-700", icon: CheckCircle },
    skipped: { color: "bg-gray-100 text-gray-500", icon: ChevronRight }
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div
      className={`
        border rounded-lg p-4 transition-all
        ${isLocked ? "bg-gray-50 opacity-60" : "bg-white"}
        ${isSkipped ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => !isLocked && setIsExpanded(!isExpanded)}
              disabled={isLocked}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            
            <h3 className={`font-semibold text-lg ${isSkipped ? "line-through" : ""}`}>
              {skillName}
            </h3>
            
            <Badge className={config.color}>
              <StatusIcon size={14} className="mr-1" />
              {status.replace("_", " ")}
            </Badge>
          </div>

          <div className="ml-9 flex items-center gap-4 text-sm text-gray-600">
            <span>{estimatedHours}h estimated</span>
            <span>•</span>
            <span>{contentCount} resources</span>
            {checkpointPassed && (
              <>
                <span>•</span>
                <span className="text-green-600 font-medium">Checkpoint passed ✓</span>
              </>
            )}
          </div>

          {isLocked && unlockCondition?.requires && (
            <div className="ml-9 mt-2 text-sm text-gray-500 flex items-center gap-2">
              <Lock size={14} />
              <span>Complete previous module to unlock</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isAvailable && onStart && (
            <Button size="sm" onClick={onStart}>
              {status === "in_progress" ? "Continue" : "Start"}
            </Button>
          )}
          
          {isAvailable && onSkip && !isSkipped && (
            <Button size="sm" variant="outline" onClick={onSkip}>
              Skip
            </Button>
          )}

          {isSkipped && onSkip && (
            <Button size="sm" variant="outline" onClick={onSkip}>
              Undo Skip
            </Button>
          )}
        </div>
      </div>

      {isExpanded && contentItems.length > 0 && (
        <div className="ml-9 mt-4 border-t pt-4 space-y-2">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {item.provider} • {item.content_type} • {item.duration_minutes}min
                </p>
              </div>
              {item.user_progress && (
                <Badge variant="outline" className="text-xs">
                  {item.user_progress.progress_percent}%
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
