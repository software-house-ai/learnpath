import type { AssessedLevel, ModuleStatus } from "@/types/api"

export interface PathInput {
  user_id: string
  goal_id: string
  assessment_results: Record<string, AssessedLevel> // skill_id → assessed level
  context: {
    hours_per_week: number   // if 0 or null, default to 7
    deadline: string | null
    reason: string
  }
}

export interface PathOutput {
  path_id: string
  module_count: number
  estimated_weeks: number
  skill_gap_count: number  // count of skills NOT assessed as proficient
  warning?: string         // set when user is proficient in all skills
}

export interface SkillNode {
  skill_id: string
  name: string
  estimated_hours: number
  difficulty: number
}

export interface GraphEdge {
  skill_id: string
  prerequisite_skill_id: string
  strength: "required" | "recommended"
}

export interface ContentSelection {
  content_item_id: string
  skill_id: string
  title: string
  difficulty_level: string
  score: number
  order_in_module: number
  is_required: boolean
}

export interface SkillWithLevels {
  skill_id: string
  allowed_levels: string[]  // e.g. ['beginner','intermediate','advanced']
}

// Suppress unused import warning — ModuleStatus is part of the public contract
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ModuleStatusRef = ModuleStatus
