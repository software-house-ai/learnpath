/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { ExploreContent } from "@/components/explore/ExploreContent"
import { SearchBar } from "@/components/explore/SearchBar"
import { FeaturedGoals } from "@/components/explore/FeaturedGoals"
import { RecentContent } from "@/components/explore/RecentContent"

export const revalidate = 3600 // Cache for 1 hour

export default async function ExplorePage() {
  const supabase = await createClient()

  // Fetch domains with counts AND we'll fetch explicitly the goals to get difficulties
  const { data: domains } = await supabase
    .from("domains")
    .select(`
      id,
      name,
      slug,
      description,
      icon_name,
      color_hex,
      skills(id),
      learning_goals(difficulty)
    `)
    .eq("is_published", true)
    .order("display_order")

  const domainsWithCounts = domains?.map((d: any) => {
    // Extract unique difficulties from the goals in this domain
    const difficulties = Array.from(new Set(d.learning_goals?.map((g: any) => g.difficulty?.toLowerCase()) || []))
    
    return {
      ...d,
      skill_count: d.skills?.length || 0,
      goal_count: d.learning_goals?.length || 0,
      difficulties
    }
  }) || []

  // Fetch featured goals (top 3 by popularity or manually featured)
  const { data: featuredGoals } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(3)

  // Fetch recently added content
  const { data: recentContent } = await supabase
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
      created_at,
      skill:skills(name, slug)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section with Search */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Explore Learning Paths</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Discover curated learning resources across multiple domains
        </p>
        <SearchBar />
      </div>

      {/* Featured Goals */}
      {featuredGoals && featuredGoals.length > 0 && (
        <FeaturedGoals goals={featuredGoals as any} />
      )}

      {/* Domain Grid with Filters */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Browse by Domain</h2>
        <ExploreContent domains={domainsWithCounts} />
      </div>

      {/* Recently Added Content */}
      {recentContent && recentContent.length > 0 && (
        <RecentContent items={recentContent as any} />
      )}
    </div>
  )
}
