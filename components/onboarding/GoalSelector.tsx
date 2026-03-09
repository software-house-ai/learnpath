"use client"

import { useEffect, useState } from "react"
import { LearningGoal, Domain, GoalDifficulty } from "@/types/api"

type GoalWithDomain = LearningGoal &
  Pick<Domain, "color_hex" | "icon_name"> & {
    domain_name: string
  }

const difficultyConfig: Record<GoalDifficulty, { label: string; className: string }> = {
  beginner_friendly: {
    label: "Beginner",
    className: "bg-green-100 text-green-700",
  },
  some_experience_needed: {
    label: "Some experience",
    className: "bg-yellow-100 text-yellow-700",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-orange-100 text-orange-700",
  },
}

interface Props {
  onSelect: (goalId: string) => void
  selectedGoalId: string | null
}

export default function GoalSelector({ onSelect, selectedGoalId }: Props) {
  const [goals, setGoals] = useState<GoalWithDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/goals")
      .then((res) => res.json())
      .then((json: { data?: GoalWithDomain[] }) => {
        if (json.data) {
          setGoals(json.data)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you want to learn?</h2>
        <p className="text-gray-500 mb-6">Pick a goal to build your personalized path</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white shadow-sm p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="flex justify-between">
                <div className="h-5 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you want to learn?</h2>
        <p className="text-red-500 mt-4">Failed to load goals. Please refresh.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you want to learn?</h2>
      <p className="text-gray-500 mb-6">Pick a goal to build your personalized path</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const diff = difficultyConfig[goal.difficulty]
          const isSelected = goal.id === selectedGoalId

          return (
            <button
              key={goal.id}
              onClick={() => onSelect(goal.id)}
              className={`text-left rounded-lg border bg-white shadow-sm p-5 transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-blue-500 border-blue-500" : "hover:border-gray-300"
              }`}
            >
              <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug">{goal.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{goal.domain_name}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff.className}`}>
                  {diff.label}
                </span>
                <span className="text-xs text-gray-400">~{goal.estimated_weeks} weeks</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
