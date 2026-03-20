"use client"

import { GoalCard } from "./GoalCard"

interface Goal {
  id: string
  title: string
  slug: string
  description: string
  difficulty: string
  estimated_weeks: number
  domain: {
    name: string
    slug: string
    color_hex: string
  }
}

interface FeaturedGoalsProps {
  goals: Goal[]
}

export function FeaturedGoals({ goals }: FeaturedGoalsProps) {
  if (goals.length === 0) return null

  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Featured Learning Paths</h2>
        <p className="text-gray-600">Popular paths chosen by our community</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  )
}
