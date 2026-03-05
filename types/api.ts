// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type AssessedLevel =
  | 'not_started'
  | 'familiar'
  | 'comfortable'
  | 'proficient'

export type ModuleStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'skipped'

export type ProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'

export type ContentType =
  | 'video'
  | 'article'
  | 'documentation'
  | 'course'
  | 'exercise'
  | 'project'
  | 'book_chapter'

export type DifficultyLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'

export type UserRole =
  | 'user'
  | 'premium'
  | 'admin'

export type SubscriptionStatus =
  | 'free'
  | 'premium'
  | 'cancelled'

export type PathStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned'

export type AssessmentMethod =
  | 'ai_quiz'
  | 'self_report'
  | 'project_submission'

export type PrerequisiteStrength =
  | 'required'
  | 'recommended'

export type GoalDifficulty =
  | 'beginner_friendly'
  | 'some_experience_needed'
  | 'intermediate'

// ─── API RESPONSE TYPES ───────────────────────────────────────────────────────

export type ApiError = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiSuccess<T> = {
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

// ─── DATABASE ENTITY TYPES ────────────────────────────────────────────────────

export type Domain = {
  id: string
  name: string
  slug: string
  description: string | null
  icon_name: string | null
  color_hex: string
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type Skill = {
  id: string
  domain_id: string
  name: string
  slug: string
  description: string | null
  difficulty: number
  estimated_hours: number
  icon_name: string | null
  is_published: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SkillPrerequisite = {
  skill_id: string
  prerequisite_skill_id: string
  strength: PrerequisiteStrength
}

export type LearningGoal = {
  id: string
  domain_id: string
  title: string
  slug: string
  description: string | null
  difficulty: GoalDifficulty
  estimated_weeks: number
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type ContentItem = {
  id: string
  skill_id: string
  title: string
  description: string | null
  content_type: ContentType
  url: string
  embed_url: string | null
  provider: string | null
  author_name: string | null
  language: string
  duration_minutes: number | null
  difficulty_level: DifficultyLevel
  is_free: boolean
  is_active: boolean
  last_verified_at: string
  needs_review: boolean
  rating_avg: number
  rating_count: number
  completion_rate: number
  tags: string[]
  thumbnail_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  daily_learning_goal_minutes: number
  preferred_language: string
  timezone: string | null
  learning_context: Record<string, unknown>
  paddle_customer_id: string | null
  subscription_status: SubscriptionStatus
  created_at: string
  updated_at: string
}

export type Path = {
  id: string
  user_id: string
  goal_id: string
  title: string
  status: PathStatus
  generated_at: string
  estimated_completion_date: string | null
  total_estimated_hours: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type PathModule = {
  id: string
  path_id: string
  skill_id: string | null
  module_order: number
  title: string
  status: ModuleStatus
  unlock_condition: Record<string, unknown>
  week_number: number
  estimated_hours: number
  checkpoint_passed: boolean
  created_at: string
  updated_at: string
}

export type UserProgress = {
  id: string
  user_id: string
  content_item_id: string
  path_module_id: string | null
  status: ProgressStatus
  progress_percent: number
  last_position_seconds: number
  time_spent_minutes: number
  completed_at: string | null
  notes: Array<{
    timestamp_seconds: number
    note_text: string
    created_at: string
  }>
  created_at: string
  updated_at: string
}

export type UserStreak = {
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  total_days_active: number
  total_minutes_learned: number
  updated_at: string
}

export type SkillAssessment = {
  id: string
  user_id: string
  skill_id: string
  assessed_level: AssessedLevel
  assessment_method: AssessmentMethod
  confidence_score: number
  raw_responses: Record<string, unknown>
  assessed_at: string
}

export type CheckpointAttempt = {
  id: string
  user_id: string
  path_module_id: string
  score_percent: number
  passed: boolean
  answers: Record<string, unknown>
  attempted_at: string
}

// ─── REQUEST / RESPONSE TYPES ─────────────────────────────────────────────────

export type OnboardingInput = {
  goal_id: string
  assessment_results: Record<string, AssessedLevel>
  context: {
    hours_per_week: number
    deadline: string | null
    reason: string
  }
}

export type ProgressUpdateInput = {
  content_item_id: string
  progress_percent: number
  last_position_seconds: number
  status?: ProgressStatus
  notes?: string
}

export type DashboardData = {
  active_paths: Array<Path & { completion_percent: number }>
  streak: UserStreak
  next_up: ContentItem | null
  time_spent_this_week: number
  goal_minutes_per_day: number
}