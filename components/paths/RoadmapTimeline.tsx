"use client"

import { ModuleCard } from "./ModuleCard"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ModuleStatus } from "@/types/api"

interface Module {
  id: string
  module_order: number
  week_number: number
  status: string
  checkpoint_passed: boolean
  unlock_condition: { requires: string[] } | null
  skill: {
    name: string
    slug: string
    estimated_hours: number
  }
  content_assignments: Array<{
    content_item: {
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
  }>
}

interface RoadmapTimelineProps {
  pathId: string
  modules: Module[]
}

export function RoadmapTimeline({ pathId, modules }: RoadmapTimelineProps) {
  const router = useRouter()
  const [loadingModuleId, setLoadingModuleId] = useState<string | null>(null)

  // Group modules by week
  const modulesByWeek = modules.reduce((acc, module) => {
    const week = module.week_number
    if (!acc[week]) acc[week] = []
    acc[week].push(module)
    return acc
  }, {} as Record<number, Module[]>)

  const weeks = Object.keys(modulesByWeek)
    .map(Number)
    .sort((a, b) => a - b)

  const handleSkip = async (moduleId: string, currentStatus: string) => {
    setLoadingModuleId(moduleId)
    const action = currentStatus === "skipped" ? "unskip" : "skip"

    try {
      const response = await fetch(`/api/paths/${pathId}/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        router.refresh() // Refresh server component data
      }
    } catch (error) {
      console.error("Failed to update module:", error)
    } finally {
      setLoadingModuleId(null)
    }
  }

  const handleStart = (moduleId: string) => {
    // Navigate to first content item in module
    const module = modules.find(m => m.id === moduleId)
    if (module?.content_assignments[0]) {
      const firstContent = module.content_assignments[0].content_item
      router.push(`/paths/${pathId}/learn/${moduleId}/${firstContent.id}`)
    }
  }

  return (
    <div className="space-y-8">
      {weeks.map(weekNum => (
        <div key={weekNum} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
              {weekNum}
            </div>
            <h2 className="text-xl font-semibold">Week {weekNum}</h2>
          </div>

          <div className="ml-6 border-l-2 border-gray-200 pl-6 space-y-4">
            {modulesByWeek[weekNum].map(module => (
              <ModuleCard
                key={module.id}
                id={module.id}
                skillName={module.skill.name}
                status={module.status as ModuleStatus}
                estimatedHours={module.skill.estimated_hours}
                contentCount={module.content_assignments.length}
                contentItems={module.content_assignments.map(ca => ca.content_item)}
                unlockCondition={module.unlock_condition}
                checkpointPassed={module.checkpoint_passed}
                onSkip={() => handleSkip(module.id, module.status)}
                onStart={() => handleStart(module.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
