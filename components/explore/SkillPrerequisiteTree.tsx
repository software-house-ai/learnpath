"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface Skill {
  id: string
  name: string
  slug: string
}

interface SkillPrerequisiteTreeProps {
  currentSkill: Skill
  prerequisites: Skill[]
}

export function SkillPrerequisiteTree({ currentSkill, prerequisites }: SkillPrerequisiteTreeProps) {
  if (prerequisites.length === 0) {
    return (
      <div className="bg-blue-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">
          This skill has no prerequisites. You can start learning right away!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-4">Learning Path</h3>
      <div className="flex flex-wrap items-center gap-3">
        {prerequisites.map((prereq, index) => (
          <div key={prereq.id} className="flex items-center gap-3">
            <Link
              href={`/skills/${prereq.slug}`}
              className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 hover:border-blue-500 hover:shadow-md transition"
            >
              <span className="font-medium">{prereq.name}</span>
            </Link>
            {index < prerequisites.length - 1 && (
              <ArrowRight className="text-gray-400" size={20} />
            )}
          </div>
        ))}
        <ArrowRight className="text-blue-600" size={24} />
        <div className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold shadow-md">
          {currentSkill.name}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4">
        Complete the skills on the left before starting <strong>{currentSkill.name}</strong>
      </p>
    </div>
  )
}
