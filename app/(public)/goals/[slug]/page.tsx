/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, CheckCircle } from "lucide-react"
import Link from "next/link"

export default async function GoalPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: goal } = await supabase
    .from("learning_goals")
    .select(`
      id,
      title,
      slug,
      description,
      difficulty,
      estimated_weeks,
      domain:domains(name, slug, color_hex),
      goal_skills:goal_skills(
        display_order,
        is_core,
        skill:skills(
          id,
          name,
          slug,
          description,
          difficulty,
          estimated_hours
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .order("display_order", { foreignTable: "goal_skills" })
    .single()

  if (!goal) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const typedGoal = goal as any

  const coreSkills = typedGoal.goal_skills.filter((gs: any) => gs.is_core)
  const optionalSkills = typedGoal.goal_skills.filter((gs: any) => !gs.is_core)

  const destinationHref = user ? `/onboarding?goal=${typedGoal.id}` : `/login?redirect=/goals/${slug}`

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge
          className="mb-4"
          style={{
            backgroundColor: `${typedGoal.domain.color_hex}20`,
            color: typedGoal.domain.color_hex
          }}
        >
          {typedGoal.domain.name}
        </Badge>
        <h1 className="text-4xl font-bold mb-4">{typedGoal.title}</h1>
        <p className="text-xl text-gray-600">{typedGoal.description}</p>
      </div>

      <div className="flex gap-6 mb-8">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={20} />
          <span className="font-medium">{typedGoal.estimated_weeks} weeks</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={20} />
          <Badge>{typedGoal.difficulty.replace(/_/g, " ")}</Badge>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <CheckCircle size={20} />
          <span className="font-medium">{coreSkills.length} core skills</span>
        </div>
      </div>

      <div className="mb-8">
        <Link href={destinationHref}>
          <Button size="lg" className="w-full md:w-auto">
            Start This Path
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Core Skills You&apos;ll Learn</h2>
        <div className="space-y-4">
          {coreSkills.map((gs: any, index: number) => (
            <div key={gs.skill.id} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{gs.skill.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{gs.skill.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{gs.skill.estimated_hours}h</Badge>
                  <Badge variant="outline">Level {gs.skill.difficulty}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {optionalSkills.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Optional Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalSkills.map((gs: any) => (
              <div key={gs.skill.id} className="bg-white rounded p-4">
                <h3 className="font-semibold">{gs.skill.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{gs.skill.estimated_hours}h</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
