/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GoalCard } from "@/components/explore/GoalCard"
import { Badge } from "@/components/ui/badge"

export default async function DomainPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: domain } = await supabase
    .from("domains")
    .select(`
      id,
      name,
      slug,
      description,
      icon_name,
      color_hex,
      skills:skills(id, name, slug, difficulty, estimated_hours),
      goals:learning_goals(
        id,
        title,
        slug,
        description,
        difficulty,
        estimated_weeks
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!domain) notFound()

  // Add domain reference to goals
  const goalsWithDomain = (domain.goals as any[]).map(g => ({
    ...g,
    domain: {
      name: domain.name,
      slug: domain.slug,
      color_hex: domain.color_hex
    }
  }))

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div
          className="inline-block p-4 rounded-lg mb-4"
          style={{ backgroundColor: `${domain.color_hex}20` }}
        >
          <h1
            className="text-4xl font-bold"
            style={{ color: domain.color_hex }}
          >
            {domain.name}
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl">{domain.description}</p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Available Learning Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsWithDomain.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Skills in this Domain</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(domain.skills as any[]).map(skill => (
            <div
              key={skill.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
            >
              <h3 className="font-semibold mb-2">{skill.name}</h3>
              <div className="flex gap-2">
                <Badge variant="secondary">{skill.estimated_hours}h</Badge>
                <Badge variant="outline">Level {skill.difficulty}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
