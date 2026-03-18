import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getQuestionsForSkill } from "@/lib/ai/question-bank"
import { assessmentSessions } from "../sessions"
import type { ApiSuccess, ApiError, AssessedLevel } from "@/types/api"

function mapDifficultyToLevel(difficulty: number): "beginner" | "intermediate" | "advanced" {
  if (difficulty <= 2) return "beginner"
  if (difficulty === 3) return "intermediate"
  return "advanced"
}

function scoreToLevel(correct: number, total: number): AssessedLevel {
  const percentage = (correct / Math.max(1, total)) * 100

  if (percentage >= 80) return "proficient"
  if (percentage >= 60) return "comfortable"
  if (percentage >= 40) return "familiar"
  return "not_started"
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
    const { session_id, question_id, answer_index, confidence } = body

    // Load session
    const session = assessmentSessions.get(session_id)
    if (!session) {
      return NextResponse.json<ApiError>(
        { error: { code: "BAD_REQUEST", message: "Session not found" } },
        { status: 400 }
      )
    }

    // Verify session belongs to user
    if (session.user_id !== user.id) {
      return NextResponse.json<ApiError>(
        { error: { code: "FORBIDDEN", message: "Session does not belong to user" } },
        { status: 403 }
      )
    }

    // Load question to check if correct
    const { data: questionData } = await supabase
      .from("question_bank")
      .select("*")
      .eq("id", question_id)
      .single()

    const questionCorrectIndex = questionData?.correct_index ?? -1
    if (!questionData) {
      console.warn("Question not found in question_bank; treating as self-rating fallback", { question_id })
    }

    const currentSkillId = session.skills_to_assess[session.current_skill_index]
    if (!currentSkillId) {
      return NextResponse.json<ApiError>(
        { error: { code: "BAD_REQUEST", message: "No skill to assess" } },
        { status: 400 }
      )
    }

    // Determine if answer is correct
    let isCorrect = false
    let assessedLevel: AssessedLevel = "not_started"

    if (questionCorrectIndex === -1) {
      // Self-rating fallback question
      const levelMap: { [key: number]: AssessedLevel } = {
        0: "not_started",
        1: "familiar",
        2: "comfortable",
        3: "proficient"
      }
      assessedLevel = levelMap[answer_index] || "not_started"
      isCorrect = true
    } else {
      isCorrect = answer_index === questionCorrectIndex
    }

    // Update session state
    if (isCorrect) {
      session.correct_count++
    } else {
      session.wrong_count++
    }
    session.current_question_count++

    // Record response
    if (!session.results[currentSkillId]) {
      session.results[currentSkillId] = {
        assessed_level: "not_started",
        confidence_score: 0,
        responses: []
      }
    }
    session.results[currentSkillId].responses.push({
      question_id,
      answer_index,
      correct: isCorrect,
      confidence
    })

    // Check early exit rules
    let shouldMoveToNextSkill = false

    if (questionCorrectIndex === -1) {
      // Self-rating: always move to next after one response
      shouldMoveToNextSkill = true
    } else if (session.correct_count >= 2 && confidence === "certain") {
      assessedLevel = "comfortable"
      shouldMoveToNextSkill = true
    } else if (session.correct_count >= 3) {
      assessedLevel = "proficient"
      shouldMoveToNextSkill = true
    } else if (session.wrong_count >= 2) {
      assessedLevel = "familiar"
      shouldMoveToNextSkill = true
    } else if (session.current_question_count >= 5) {
      assessedLevel = scoreToLevel(session.correct_count, session.current_question_count)
      shouldMoveToNextSkill = true
    }

    if (shouldMoveToNextSkill) {
      // Save current skill result
      const totalResponses = session.results[currentSkillId].responses.length
      const avgConfidence =
        session.results[currentSkillId].responses.reduce((sum: number, r: { confidence: string }) => {
          const val = r.confidence === "certain" ? 1 : r.confidence === "pretty_sure" ? 0.7 : 0.3
          return sum + val
        }, 0) / totalResponses

      session.results[currentSkillId].assessed_level = assessedLevel
      session.results[currentSkillId].confidence_score = avgConfidence

      session.current_skill_index++
      session.correct_count = 0
      session.wrong_count = 0
      session.current_question_count = 0
    }

    // Check if all skills assessed
    if (session.current_skill_index >= session.skills_to_assess.length) {
      return NextResponse.json<
        ApiSuccess<{
          assessment_complete: boolean
          results: typeof session.results
        }>
      >({
        data: {
          assessment_complete: true,
          results: session.results
        }
      })
    }

    // Get next question
    const nextSkillId = session.skills_to_assess[session.current_skill_index]

    // Get skill details for next question
    const { data: skillData } = await supabase
      .from("skills")
      .select("*")
      .eq("id", nextSkillId)
      .single()

    if (!skillData) {
      return NextResponse.json<ApiError>(
        { error: { code: "INTERNAL_ERROR", message: "Skill not found" } },
        { status: 500 }
      )
    }

    const difficulty = mapDifficultyToLevel(skillData.difficulty)
    const nextQuestions = await getQuestionsForSkill(
      nextSkillId,
      skillData.name,
      difficulty,
      1
    )

    if (!nextQuestions || nextQuestions.length === 0) {
      return NextResponse.json<ApiError>(
        { error: { code: "INTERNAL_ERROR", message: "Failed to generate next question" } },
        { status: 500 }
      )
    }

    return NextResponse.json<
      ApiSuccess<{
        assessment_complete: boolean
        question: (typeof nextQuestions)[0]
        current_skill_index: number
        total_skills: number
        current_skill_name: string
      }>
    >({
      data: {
        assessment_complete: false,
        question: nextQuestions[0],
        current_skill_index: session.current_skill_index,
        total_skills: session.skills_to_assess.length,
        current_skill_name: skillData.name
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
