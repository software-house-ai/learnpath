import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getQuestionsForSkill } from "@/lib/ai/question-bank"
import { assessmentSessions, type AssessmentSession } from "../sessions"
import type { ApiSuccess, ApiError } from "@/types/api"

interface SkillWithDifficulty {
  id: string
  name: string
  difficulty: number
}

function mapDifficultyToLevel(difficulty: number): "beginner" | "intermediate" | "advanced" {
  if (difficulty <= 2) return "beginner"
  if (difficulty === 3) return "intermediate"
  return "advanced"
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { goal_id } = body

    if (!goal_id) {
      return NextResponse.json<ApiError>(
        { error: { code: "BAD_REQUEST", message: "goal_id is required" } },
        { status: 400 }
      )
    }

    // Fetch all skills for this goal with their difficulty levels
    const { data: goalSkillsData, error: goalSkillsError } = await supabase
      .from("goal_skills")
      .select("skill_id, skills(id, name, difficulty, is_published)")
      .eq("goal_id", goal_id)
      .order("display_order", { ascending: true })

    if (goalSkillsError) {
      throw goalSkillsError
    }

    const skillsRaw = goalSkillsData || []
    const skills: SkillWithDifficulty[] = skillsRaw
      .map((item: { skills: { id: string; name: string; difficulty?: number; is_published?: boolean } | { id: string; name: string; difficulty?: number; is_published?: boolean }[] | null }) => {
        const skill = Array.isArray(item.skills) ? item.skills[0] : item.skills
        if (!skill || skill.is_published === false) return null
        return { id: skill.id, name: skill.name, difficulty: skill.difficulty || 3 }
      })
      .filter((s: SkillWithDifficulty | null): s is SkillWithDifficulty => s !== null)

    // Filter skills: exclude already proficient assessments
    const { data: existingAssessments } = await supabase
      .from("skill_assessments")
      .select("skill_id, assessed_level")
      .eq("user_id", user.id)
      .in(
        "skill_id",
        skills.map((s: SkillWithDifficulty) => s.id)
      )

    const existingMap = new Map(
      (existingAssessments || []).map((a: { skill_id: string; assessed_level: string }) => [a.skill_id, a.assessed_level])
    )

    const skillsToAssess = skills.filter((s: SkillWithDifficulty) => existingMap.get(s.id) !== "proficient")

    if (skillsToAssess.length === 0) {
      return NextResponse.json<ApiSuccess<{ assessment_complete: boolean; message: string }>>(
        { data: { assessment_complete: true, message: "All skills already proficient" } }
      )
    }

    // Generate session
    const session_id = crypto.randomUUID()
    const firstSkill = skillsToAssess[0]
    const difficulty = mapDifficultyToLevel(firstSkill.difficulty)

    // Get first question
    const questions = await getQuestionsForSkill(
      firstSkill.id,
      firstSkill.name,
      difficulty,
      1
    )

    if (!questions || questions.length === 0) {
      throw new Error("Failed to generate assessment questions")
    }

    const session: AssessmentSession = {
      session_id,
      user_id: user.id,
      goal_id,
      skills_to_assess: skillsToAssess.map((s: SkillWithDifficulty) => s.id),
      current_skill_index: 0,
      current_question_count: 0,
      correct_count: 0,
      wrong_count: 0,
      results: {}
    }

    assessmentSessions.set(session_id, session)

    return NextResponse.json<
      ApiSuccess<{
        session_id: string
        total_skills: number
        current_skill_index: number
        current_skill_name: string
        question: (typeof questions)[0]
      }>
    >({
      data: {
        session_id,
        total_skills: skillsToAssess.length,
        current_skill_index: 0,
        current_skill_name: firstSkill.name,
        question: questions[0]
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiError>(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
