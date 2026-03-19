"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp } from "lucide-react"

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

interface GoalCardProps {
  goal: Goal
}

export function GoalCard({ goal }: GoalCardProps) {
  const difficultyColors = {
    beginner_friendly: "bg-green-100 text-green-700",
    some_experience_needed: "bg-yellow-100 text-yellow-700",
    intermediate: "bg-orange-100 text-orange-700"
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="mb-4">
        <Badge
          className="mb-2"
          style={{
            backgroundColor: `${goal.domain.color_hex}20`,
            color: goal.domain.color_hex
          }}
        >
          {goal.domain.name}
        </Badge>
        <h3 className="text-xl font-bold mb-2">{goal.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2">{goal.description}</p>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock size={16} />
          <span>{goal.estimated_weeks} weeks</span>
        </div>
        <Badge className={difficultyColors[goal.difficulty as keyof typeof difficultyColors] || "bg-gray-100 text-gray-700"}>
          <TrendingUp size={14} className="mr-1" />
          {goal.difficulty.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Link href={`/goals/${goal.slug}`} className="flex-1">
          <Button className="w-full">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  )
}
