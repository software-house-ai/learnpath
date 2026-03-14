import type { SupabaseClient } from "@supabase/supabase-js"
import type { AssessedLevel } from "@/types/api"
import type { ContentSelection } from "./types"
import { PathGenerationError } from "./errors"

// ─── Map assessment level → allowed content difficulty levels ─────────────────

export function getDifficultyLevelsForAssessment(
  level: AssessedLevel
): string[] {
  switch (level) {
    case "proficient":  return []
    case "comfortable": return ["advanced"]
    case "familiar":    return ["intermediate", "advanced"]
    case "not_started": return ["beginner", "intermediate", "advanced"]
    default:            return ["beginner", "intermediate", "advanced"]
  }
}

// ─── Bayesian content scorer ──────────────────────────────────────────────────

export function scoreContent(item: {
  rating_avg: number
  rating_count: number
  completion_rate: number
  created_at: string
}): number {
  // Bayesian average — prevents 1 five-star review gaming the score
  const bayesianRating =
    (item.rating_count * item.rating_avg + 10 * 3.5) / (item.rating_count + 10)
  const adjustedRatingScore = (bayesianRating / 5.0) * 0.40

  const completionScore = (item.completion_rate / 100.0) * 0.40

  const daysSinceCreated =
    (Date.now() - new Date(item.created_at).getTime()) / 86400000
  const recencyScore =
    daysSinceCreated < 365 ? 1.0 : daysSinceCreated < 730 ? 0.7 : 0.4
  const recencyWeight = recencyScore * 0.20

  return adjustedRatingScore + completionScore + recencyWeight
}

// ─── Select and score content for a skill ────────────────────────────────────

type RawContentItem = {
  id: string
  skill_id: string
  title: string
  difficulty_level: string
  rating_avg: number
  rating_count: number
  completion_rate: number
  created_at: string
}

async function queryContent(
  skillId: string,
  levels: string[],
  supabase: SupabaseClient
): Promise<RawContentItem[]> {
  const { data, error } = await supabase
    .from("content_items")
    .select("id, skill_id, title, difficulty_level, rating_avg, rating_count, completion_rate, created_at")
    .eq("skill_id", skillId)
    .eq("is_active", true)
    .in("difficulty_level", levels)

  if (error) {
    throw new PathGenerationError("Failed to query content items", error)
  }

  return (data ?? []) as RawContentItem[]
}

export async function selectContent(
  skillId: string,
  allowedLevels: string[],
  supabase: SupabaseClient
): Promise<ContentSelection[]> {
  if (allowedLevels.length === 0) return []

  let items = await queryContent(skillId, allowedLevels, supabase)

  // Fallback: progressively broaden difficulty levels if no content found
  if (items.length === 0 && allowedLevels.length === 1 && allowedLevels[0] === "advanced") {
    items = await queryContent(skillId, ["intermediate", "advanced"], supabase)
  }
  if (items.length === 0) {
    items = await queryContent(skillId, ["beginner", "intermediate", "advanced"], supabase)
  }
  if (items.length === 0) return []

  // Score, sort, take top 5
  const scored = items
    .map(item => ({ item, score: scoreContent(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return scored.map(({ item, score }, index) => ({
    content_item_id: item.id,
    skill_id: item.skill_id,
    title: item.title,
    difficulty_level: item.difficulty_level,
    score,
    order_in_module: index + 1,
    is_required: true,
  }))
}
