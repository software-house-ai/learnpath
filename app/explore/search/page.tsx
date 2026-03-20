import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, Target, FileText } from "lucide-react"

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: query } = await searchParams

  if (!query || query.trim().length < 2) {
    redirect("/explore")
  }

  const supabase = await createClient()

  // Perform search across all three tables
  const [goalsResult, skillsResult, contentResult] = await Promise.all([
    supabase
      .from("learning_goals")
      .select(`
        id,
        title,
        slug,
        description,
        difficulty,
        estimated_weeks,
        domain:domains(name, slug, color_hex)
      `)
      .eq("is_published", true)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "english"
      })
      .limit(10),

    supabase
      .from("skills")
      .select(`
        id,
        name,
        slug,
        description,
        difficulty,
        estimated_hours,
        domain:domains(name, slug, color_hex)
      `)
      .eq("is_published", true)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "english"
      })
      .limit(15),

    supabase
      .from("content_items")
      .select(`
        id,
        title,
        description,
        content_type,
        provider,
        duration_minutes,
        difficulty_level,
        thumbnail_url,
        rating_avg,
        skill:skills!inner(name, slug, domain:domains(name, color_hex))
      `)
      .eq("is_active", true)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "english"
      })
      .limit(20)
  ])

  const goals = goalsResult.data || []
  const skills = skillsResult.data || []
  const content = contentResult.data || []
  const totalResults = goals.length + skills.length + content.length

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Search Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search size={28} className="text-gray-400" />
          <h1 className="text-3xl font-bold">Search Results</h1>
        </div>
        <p className="text-gray-600">
          Found <strong>{totalResults}</strong> results for &quot;<strong>{query}</strong>&quot;
        </p>
      </div>

      {/* No Results */}
      {totalResults === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Search size={48} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No results found</h2>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find anything matching &quot;<strong>{query}</strong>&quot;
          </p>
          <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
            <p className="font-semibold mb-3">Try searching for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["JavaScript", "Python", "React", "Data Science", "Machine Learning"].map(term => (
                <Link
                  key={term}
                  href={`/explore/search?q=${encodeURIComponent(term)}`}
                  className="px-3 py-1 bg-white rounded-full text-sm hover:bg-blue-100 transition"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Learning Goals Results */}
      {goals.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold">Learning Paths ({goals.length})</h2>
          </div>
          <div className="space-y-4">
            {goals.map((goal: Record<string, unknown>) => (
              <Link
                key={goal.id as string}
                href={`/goals/${goal.slug as string}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge
                      className="mb-2"
                      style={{
                        backgroundColor: `${(goal.domain as Record<string, unknown>).color_hex as string}20`,
                        color: (goal.domain as Record<string, unknown>).color_hex as string
                      }}
                    >
                      {(goal.domain as Record<string, unknown>).name as string}
                    </Badge>
                    <h3 className="text-xl font-bold mb-2">{goal.title as string}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{goal.description as string}</p>
                    <div className="flex gap-3 text-sm text-gray-500">
                      <span>{goal.estimated_weeks as number} weeks</span>
                      <span>•</span>
                      <span>{(goal.difficulty as string).replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Skills Results */}
      {skills.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="text-green-600" size={24} />
            <h2 className="text-2xl font-bold">Skills ({skills.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill: Record<string, unknown>) => (
              <Link
                key={skill.id as string}
                href={`/skills/${skill.slug as string}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-4"
              >
                <Badge
                  className="mb-2"
                  style={{
                    backgroundColor: `${(skill.domain as Record<string, unknown>).color_hex as string}20`,
                    color: (skill.domain as Record<string, unknown>).color_hex as string
                  }}
                >
                  {(skill.domain as Record<string, unknown>).name as string}
                </Badge>
                <h3 className="font-bold mb-2">{skill.name as string}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{skill.description as string}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">{skill.estimated_hours as number}h</Badge>
                  <Badge variant="outline" className="text-xs">Level {skill.difficulty as number}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content Items Results */}
      {content.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <FileText className="text-purple-600" size={24} />
            <h2 className="text-2xl font-bold">Learning Resources ({content.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.map((item: Record<string, unknown>) => (
              <div
                key={item.id as string}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {item.provider as string}
                    </Badge>
                    <h3 className="font-semibold">{item.title as string}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">{item.content_type as string}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description as string}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-2 text-gray-500">
                    <span>{item.duration_minutes as number}min</span>
                    {(item.rating_avg as number) > 0 && (
                      <span>⭐ {(item.rating_avg as number).toFixed(1)}</span>
                    )}
                  </div>
                  <Badge
                    style={{
                      backgroundColor: `${((item.skill as Record<string, unknown>).domain as Record<string, unknown>).color_hex as string}20`,
                      color: ((item.skill as Record<string, unknown>).domain as Record<string, unknown>).color_hex as string
                    }}
                    className="text-xs"
                  >
                    {(item.skill as Record<string, unknown>).name as string}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
