import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { AssessedLevel } from "@/types/api"

interface Skill {
  id: string
  name: string
  description: string
}

interface AssessmentStepProps {
  goalId: string | null
  assessments: Record<string, AssessedLevel>
  onChange: (assessments: Record<string, AssessedLevel>) => void
}

export default function AssessmentStep({ goalId, assessments, onChange }: AssessmentStepProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!goalId) return

    const loadSkills = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("goal_skills")
        .select(`
          skills (
            id,
            name,
            description
          )
        `)
        .eq("goal_id", goalId)

      if (!error && data) {
        // filter out nulls and map
        const loadedSkills = data
          .map((d: { skills: Skill | Skill[] | null }) => Array.isArray(d.skills) ? d.skills[0] : d.skills)
          .filter(Boolean) as Skill[]
        setSkills(loadedSkills)
        
        // initialize any missing assessments to not_started
        const newAssessments = { ...assessments }
        let changed = false
        loadedSkills.forEach((s) => {
          if (!newAssessments[s.id]) {
            newAssessments[s.id] = "not_started"
            changed = true
          }
        })
        if (changed) onChange(newAssessments)
      }
      setLoading(false)
    }

    loadSkills()
  }, [goalId, assessments, onChange])

  if (loading) {
    return <div className="text-center py-16">Loading skills...</div>
  }

  if (skills.length === 0) {
    return <div className="text-center py-16 text-gray-500">No skills found for this goal.</div>
  }

  const levels: { value: AssessedLevel; label: string }[] = [
    { value: "not_started", label: "Brand New" },
    { value: "familiar", label: "Familiar" },
    { value: "comfortable", label: "Comfortable" },
    { value: "proficient", label: "Proficient" },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Assess your current skills</h2>
      <p className="text-gray-600 mb-6">
        Let us know where you stand with these core skills so we can tailor your learning path.
      </p>

      <div className="space-y-6">
        {skills.map((skill) => (
          <div key={skill.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-lg">{skill.name}</h3>
            {skill.description && (
              <p className="text-sm text-gray-500 mb-4">{skill.description}</p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {levels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => onChange({ ...assessments, [skill.id]: level.value })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    assessments[skill.id] === level.value
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
