// Module-level store for assessment sessions during their lifetime
import type { AssessedLevel } from "@/types/api"

export interface AssessmentSession {
  session_id: string
  user_id: string
  goal_id: string
  skills_to_assess: string[]
  current_skill_index: number
  current_question_count: number
  correct_count: number
  wrong_count: number
  results: {
    [skill_id: string]: {
      assessed_level: AssessedLevel
      confidence_score: number
      responses: Array<{
        question_id: string
        answer_index: number
        correct: boolean
        confidence: string
      }>
    }
  }
}

export const assessmentSessions = new Map<string, AssessmentSession>()
