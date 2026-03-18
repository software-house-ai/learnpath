"use client"

interface DashboardData {
  streak: {
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
    total_days_active: number
    total_minutes_learned: number
  }
}

interface StreakCardProps {
  streak: DashboardData["streak"]
}

export function StreakCard({ streak }: StreakCardProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - (6 - i))
    return d.toISOString().split("T")[0]
  })

  const isActive = last7Days.map((_, i) => i >= (7 - streak.current_streak))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold mb-4">Learning Streak</h2>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-5xl font-bold text-orange-500">{streak.current_streak}</p>
          <p className="text-sm text-gray-500">day streak</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700">{streak.longest_streak}</p>
          <p className="text-sm text-gray-500">best streak</p>
        </div>
      </div>
      <div className="flex gap-2 justify-between">
        {last7Days.map((day, i) => (
          <div
            key={day}
            className={`w-8 h-8 rounded-full ${isActive[i] ? "bg-orange-400" : "bg-gray-200"}`}
            title={day}
          />
        ))}
      </div>
    </div>
  )
}
