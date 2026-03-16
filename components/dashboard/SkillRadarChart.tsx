"use client"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip
} from "recharts"

interface DashboardData {
  skill_progress: Array<{
    skill_name: string
    assessed_level: string
    modules_completed: number
    modules_total: number
  }>
}

interface SkillRadarChartProps {
  skillProgress: DashboardData["skill_progress"]
}

const levelToNum: Record<string, number> = {
  not_started: 0,
  familiar: 25,
  comfortable: 50,
  proficient: 100
}

export function SkillRadarChart({ skillProgress }: SkillRadarChartProps) {
  const chartData = skillProgress.map(s => ({
    skill: s.skill_name.length > 12 ? s.skill_name.slice(0, 12) + "…" : s.skill_name,
    Assessed: levelToNum[s.assessed_level] ?? 0,
    Progress: s.modules_total > 0 ? Math.round((s.modules_completed / s.modules_total) * 100) : 0
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold mb-4">Skill Progress</h2>
      {skillProgress.length === 0 ? (
        <p className="text-gray-500 text-sm">Complete your assessment to see skill data.</p>
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar name="Assessed Level" dataKey="Assessed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Radar name="Current Progress" dataKey="Progress" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
