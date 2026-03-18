"use client"

import type { AssessedLevel } from "@/types/api"

interface Skill {
  skill_name: string
  assessed_level: AssessedLevel
  confidence_score: number
}

interface SkillMapResultProps {
  results: {
    [skill_id: string]: Skill
  }
  goalTitle: string
  onContinue: () => void
}

export default function SkillMapResult({ results, goalTitle, onContinue }: SkillMapResultProps) {
  const skills = Object.entries(results).map(([, skill]) => skill)
  const proficientCount = skills.filter(s => s.assessed_level === "proficient").length

  const levelConfig = {
    not_started: {
      badge: "bg-gray-100 text-gray-600",
      icon: "📍",
      label: "Not Started",
      description: "Will be included in your path"
    },
    familiar: {
      badge: "bg-yellow-100 text-yellow-700",
      icon: "💡",
      label: "Familiar",
      description: "Will be included in your path"
    },
    comfortable: {
      badge: "bg-blue-100 text-blue-700",
      icon: "⚡",
      label: "Comfortable",
      description: "Will be included in your path"
    },
    proficient: {
      badge: "bg-green-100 text-green-700",
      icon: "✓",
      label: "Proficient",
      description: "Will be skipped in your path"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Your Skill Map</h2>
        <p className="text-gray-600">
          We assessed <span className="font-semibold">{skills.length}</span> skills for{" "}
          <span className="font-semibold">{goalTitle}</span>. Here&apos;s where you stand:
        </p>
      </div>

      {/* Summary */}
      {proficientCount > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            🎉 Great news! You&apos;re already proficient in{" "}
            <span className="font-bold">{proficientCount}</span> skill
            {proficientCount !== 1 ? "s" : ""}
            . These will be skipped in your personalized path.
          </p>
        </div>
      )}

      {/* Skills Grid */}
      <div className="grid gap-4">
        {skills.map((skill, index) => {
          const config = levelConfig[skill.assessed_level]

          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {skill.skill_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.badge}`}
                    >
                      {config.icon} {config.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {config.description}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(skill.confidence_score * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">Confidence</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA Button */}
      <div className="pt-4">
        <button
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>Continue to Final Step</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}
