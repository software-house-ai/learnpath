import { createClient } from "@/lib/supabase/server"
import { generateAssessmentQuestion, AssessmentQuestion } from "./assessment"
import { DifficultyLevel } from "@/types/api"

const MIN_QUESTIONS_THRESHOLD = 10 // generate new questions if below this

export async function getQuestionsForSkill(
  skillId: string,
  skillName: string,
  difficulty: DifficultyLevel,
  count: number = 5
): Promise<AssessmentQuestion[]> {
  const supabase = await createClient()

  // Step 1: Check existing questions in DB for this skill + difficulty
  const { data: existingQuestions } = await supabase
    .from("question_bank")
    .select("*")
    .eq("skill_id", skillId)
    .eq("difficulty_level", difficulty)
    .order("times_used", { ascending: true }) // use least-used questions first

  const existing = existingQuestions || []

  // Step 2: If we have fewer than MIN_QUESTIONS_THRESHOLD, generate more
  if (existing.length < MIN_QUESTIONS_THRESHOLD) {
    const toGenerate = MIN_QUESTIONS_THRESHOLD - existing.length
    const newQuestions: AssessmentQuestion[] = []

    for (let i = 0; i < toGenerate; i++) {
      try {
        const q = await generateAssessmentQuestion(skillName, difficulty)
        if (!q.is_fallback) {
          // Save to DB for future use
          await supabase.from("question_bank").insert({
            skill_id: skillId,
            difficulty_level: difficulty,
            question_text: q.question,
            options: q.options,
            correct_index: q.correct_index,
            explanation: q.explanation,
            times_used: 0
          })
          newQuestions.push(q)
        }
      } catch (err) {
        console.error("Failed to generate question:", err)
      }
    }
  }

  // Step 3: Reload questions after potential generation
  const { data: allQuestions } = await supabase
    .from("question_bank")
    .select("*")
    .eq("skill_id", skillId)
    .eq("difficulty_level", difficulty)
    .order("times_used", { ascending: true })
    .limit(count)

  if (!allQuestions || allQuestions.length === 0) {
    // Full fallback: generate self-rating question and persist it so answer API can resolve question_id
    const fallback = await generateAssessmentQuestion(skillName, difficulty)

    const { data: insertedFallback, error: insertFallbackError } = await supabase
      .from("question_bank")
      .insert({
        skill_id: skillId,
        difficulty_level: difficulty,
        question_text: fallback.question,
        options: fallback.options,
        correct_index: fallback.correct_index,
        explanation: fallback.explanation,
        times_used: 1
      })
      .select("id, question_text, options, correct_index, explanation")
      .single()

    if (insertFallbackError || !insertedFallback) {
      console.error("Failed to persist fallback question:", insertFallbackError)
      return [fallback]
    }

    return [{
      id: insertedFallback.id,
      question: insertedFallback.question_text,
      options: insertedFallback.options,
      correct_index: insertedFallback.correct_index,
      explanation: insertedFallback.explanation,
      is_fallback: true
    }]
  }

  // Step 4: Increment times_used for selected questions - simpler approach
  const selectedIds = allQuestions.map((q: { id: string }) => q.id)
  for (const id of selectedIds) {
    const question = allQuestions.find((q: { id: string; times_used: number }) => q.id === id)
    if (question) {
      await supabase
        .from("question_bank")
        .update({ times_used: (question.times_used || 0) + 1 })
        .eq("id", id)
    }
  }

  // Map DB rows to AssessmentQuestion interface
  return allQuestions.map((row: { id: string; question_text: string; options: string[]; correct_index: number; explanation: string }) => ({
    id: row.id,
    question: row.question_text,
    options: row.options,
    correct_index: row.correct_index,
    explanation: row.explanation
  }))
}
