import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, TrendingUp, Target } from "lucide-react"
import { SkillPrerequisiteTree } from "@/components/explore/SkillPrerequisiteTree"
import Link from "next/link"

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch skill with prerequisites and content
  const { data: skill } = await supabase
    .from("skills")
    .select(`
      id,
      name,
      slug,
      description,
      difficulty,
      estimated_hours,
      domain:domains(name, slug, color_hex),
      prerequisites:skill_prerequisites!skill_id(
        prerequisite:skills!prerequisite_skill_id(
          id,
          name,
          slug
        )
      ),
      content:content_items(
        id,
        title,
        description,
        content_type,
        provider,
        duration_minutes,
        difficulty_level,
        thumbnail_url,
        rating_avg,
        url
      ),
      goals:goal_skills(
        goal:learning_goals(
          id,
          title,
          slug,
          difficulty,
          estimated_weeks
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("content.is_active", true)
    .single()

  if (!skill) notFound()

  // Group content by difficulty
  const contentByDifficulty = {
    beginner: skill.content.filter((c: Record<string, unknown>) => c.difficulty_level === "beginner"),
    intermediate: skill.content.filter((c: Record<string, unknown>) => c.difficulty_level === "intermediate"),
    advanced: skill.content.filter((c: Record<string, unknown>) => c.difficulty_level === "advanced")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prerequisites = skill.prerequisites.map((p: any) => p.prerequisite) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relatedGoals = skill.goals.map((g: any) => g.goal).filter(Boolean) as any[]

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Skill Header */}
      <div className="mb-8">
        <Badge
          className="mb-4"
          style={{
            backgroundColor: `${Array.isArray(skill.domain) ? (skill.domain[0] as Record<string, unknown>)?.color_hex : (skill.domain as Record<string, unknown>)?.color_hex}20`,
            color: Array.isArray(skill.domain) ? (skill.domain[0] as Record<string, unknown>)?.color_hex as string : (skill.domain as Record<string, unknown>)?.color_hex as string
          }}
        >
          {Array.isArray(skill.domain) ? (skill.domain[0] as Record<string, unknown>)?.name as string : (skill.domain as Record<string, unknown>)?.name as string}
        </Badge>
        <h1 className="text-4xl font-bold mb-4">{skill.name}</h1>
        <p className="text-xl text-gray-600 mb-6">{skill.description}</p>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={18} />
            <span className="font-medium">{skill.estimated_hours} hours to master</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            <Badge>Level {skill.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Target size={18} />
            <span className="font-medium">{skill.content.length} learning resources</span>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div className="mb-12 bg-gray-50 rounded-lg p-6">
          <SkillPrerequisiteTree
            currentSkill={{ id: skill.id, name: skill.name, slug: skill.slug }}
            prerequisites={prerequisites}
          />
        </div>
      )}

      {/* Content Tabs by Difficulty */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Learning Resources</h2>
        <Tabs defaultValue="beginner" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="beginner">
              Beginner ({contentByDifficulty.beginner.length})
            </TabsTrigger>
            <TabsTrigger value="intermediate">
              Intermediate ({contentByDifficulty.intermediate.length})
            </TabsTrigger>
            <TabsTrigger value="advanced">
              Advanced ({contentByDifficulty.advanced.length})
            </TabsTrigger>
          </TabsList>

          {(["beginner", "intermediate", "advanced"] as const).map(level => (
            <TabsContent key={level} value={level} className="mt-6">
              {contentByDifficulty[level].length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No {level} content available yet. Check back soon!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contentByDifficulty[level].map((item: Record<string, unknown>) => (
                    <div key={item.id as string} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {item.provider as string}
                          </Badge>
                          <h3 className="font-semibold text-lg">{item.title as string}</h3>
                        </div>
                        <Badge variant="outline">{item.content_type as string}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {item.description as string}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{item.duration_minutes as number}min</span>
                          {(item.rating_avg as number) > 0 && (
                            <span>⭐ {(item.rating_avg as number).toFixed(1)}</span>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          <a href={item.url as string} target="_blank" rel="noopener noreferrer">
                            View Resource
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Related Learning Goals */}
      {relatedGoals.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Learning Paths that Include This Skill</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {relatedGoals.map((goal: any) => (
              <Link
                key={goal.id as string}
                href={`/goals/${goal.slug}`}
                className="bg-white rounded-lg p-4 hover:shadow-md transition border border-blue-200"
              >
                <h3 className="font-semibold mb-2">{goal.title as string}</h3>
                <div className="flex gap-2 text-sm text-gray-600">
                  <Badge variant="outline">{(goal.difficulty as string).replace(/_/g, " ")}</Badge>
                  <span>•</span>
                  <span>{goal.estimated_weeks as number} weeks</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
