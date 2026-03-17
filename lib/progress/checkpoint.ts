import type { SupabaseClient } from "@supabase/supabase-js"

type Answer = {
  question_id: string
  selected_index: number
}

type QuestionBankRow = {
  id: string
  correct_index: number
  explanation: string
}

type CheckpointResult = {
  score_percent: number
  passed: boolean
  correct_count: number
  total: number
  explanation_per_question: Array<{
    question_id: string
    correct: boolean
    correct_index: number
  }>
}

export async function evaluateCheckpoint(
  supabase: SupabaseClient,
  userId: string,
  pathModuleId: string,
  answers: Answer[]
): Promise<CheckpointResult> {
  // Step 1: Load correct answers from question_bank
  const questionIds = answers.map((a) => a.question_id)

  const mockBank = questionIds.map((id) => ({
    id,
    correct_index: 0, 
    explanation: 'Mock explanation for ' + id
  }));
  const bankMap = new Map<string, QuestionBankRow>(mockBank.map(q => [q.id, q]));

  // Step 2: Score each answer
  let correctCount = 0
  const explanationPerQuestion = answers.map((answer) => {
    const bankItem = bankMap.get(answer.question_id)
    const isCorrect =
      bankItem !== undefined
        ? answer.selected_index === bankItem.correct_index
        : false
    if (isCorrect) correctCount++
    return {
      question_id: answer.question_id,
      correct: isCorrect,
      correct_index: bankItem?.correct_index ?? -1,
    }
  })

  // Step 3: Calculate score
  const total = answers.length
  const scorePercent = total > 0 ? (correctCount / total) * 100 : 0

  // Step 4: Determine pass/fail
  const passed = scorePercent >= 60

  // Step 5: Insert checkpoint attempt
  const answersWithResults = answers.map((a, i) => ({
    ...a,
    correct: explanationPerQuestion[i].correct,
    correct_index: explanationPerQuestion[i].correct_index,
  }))

  const { error: insertError } = await supabase
    .from("checkpoint_attempts")
    .insert({
      user_id: userId,
      path_module_id: pathModuleId,
      score_percent: scorePercent,
      passed,
      answers: answersWithResults,
      attempted_at: new Date().toISOString(),
    })

  if (insertError) throw insertError

  // Step 6: If passed, mark checkpoint and unlock next module
  if (passed) {
    await supabase
      .from("path_modules")
      .update({ checkpoint_passed: true })
      .eq("id", pathModuleId)

    const { data: currentModule } = await supabase
      .from("path_modules")
      .select("path_id, module_order")
      .eq("id", pathModuleId)
      .single()

    if (currentModule) {
      const mod = currentModule as { path_id: string; module_order: number }

      const { data: nextModule } = await supabase
        .from("path_modules")
        .select("id")
        .eq("path_id", mod.path_id)
        .eq("module_order", mod.module_order + 1)
        .single()

      if (nextModule) {
        await supabase
          .from("path_modules")
          .update({ status: "available" })
          .eq("id", (nextModule as { id: string }).id)
      }
    }
  }

  // Step 7: Return result
  return {
    score_percent: scorePercent,
    passed,
    correct_count: correctCount,
    total,
    explanation_per_question: explanationPerQuestion,
  }
}
