/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { ExploreContent } from "@/components/explore/ExploreContent"

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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Explore Learning Paths</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose from our curated domains and start your personalized learning journey
        </p>
      </div>

      <ExploreContent domains={domainsWithCounts} />
    </div>
  )
}
