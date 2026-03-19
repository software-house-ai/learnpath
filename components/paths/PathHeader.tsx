"use client"

import { Progress } from "@/components/ui/progress"

interface PathHeaderProps {
  goalTitle: string
  completionPercent: number
  totalWeeks: number
  estimatedCompletionDate: string
  hoursPerWeek: number
}

export function PathHeader({
  goalTitle,
  completionPercent,
  totalWeeks,
  estimatedCompletionDate,
  hoursPerWeek
}: PathHeaderProps) {
  const formattedDate = new Date(estimatedCompletionDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h1 className="text-3xl font-bold mb-2">{goalTitle}</h1>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-gray-600">
          {totalWeeks} weeks • {hoursPerWeek}hrs/week
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-semibold">{completionPercent}%</span>
        </div>
        <Progress value={completionPercent} className="h-3" />
        <p className="text-sm text-gray-600">
          At this pace, you'll finish by <span className="font-semibold">{formattedDate}</span>
        </p>
      </div>
    </div>
  )
}
