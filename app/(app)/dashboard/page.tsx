"use client"
import { useEffect, useState } from "react"
import { ProgressOverview } from "@/components/dashboard/ProgressOverview"
import { StreakCard } from "@/components/dashboard/StreakCard"
import { NextUpCard } from "@/components/dashboard/NextUpCard"
import { SkillRadarChart } from "@/components/dashboard/SkillRadarChart"

interface DashboardData {
  active_paths: Array<{
    path_id: string
    goal_title: string
    status: string
    completion_percent: number
    estimated_completion_date: string | null
    next_content: {
      id: string
      title: string
      thumbnail_url: string | null
      duration_minutes: number | null
      module_title: string
    } | null
  }>
  streak: {
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
    total_days_active: number
    total_minutes_learned: number
  }
  time_this_week: number
  goal_minutes_per_day: number
  skill_progress: Array<{
    skill_name: string
    assessed_level: string
    modules_completed: number
    modules_total: number
  }>
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true)
      try {
        const res = await fetch("/api/user/dashboard")
        if (!res.ok) {
          setError("Failed to load dashboard")
          setIsLoading(false)
          return
        }
        const data = await res.json()
        setDashboardData(data.data)
      } catch {
        setError("Error loading dashboard data")
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="mb-8">
          <NextUpCard
            nextContent={dashboardData.active_paths[0]?.next_content || null}
            pathId={dashboardData.active_paths[0]?.path_id || ""}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <ProgressOverview paths={dashboardData.active_paths} />
          </div>
          <div>
            <StreakCard streak={dashboardData.streak} />
          </div>
        </div>

<SkillRadarChart skillProgress={dashboardData.skill_progress} />
      </div>
    </div>
  )
}
