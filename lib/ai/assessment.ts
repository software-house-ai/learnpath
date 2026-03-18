import { DifficultyLevel } from "@/types/api"

export interface AssessmentQuestion {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  is_fallback?: boolean
}

export async function generateAssessmentQuestion(
  skillName: string,
  difficulty: DifficultyLevel
): Promise<AssessmentQuestion> {
  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey) {
    return generateFallbackQuestion(skillName, difficulty)
  }

  try {
    const prompt = `You are a technical skill assessor for ${skillName}.
Generate ONE multiple choice question at ${difficulty} level.
Return ONLY valid JSON in this exact format with no other text:
{
  "question": "question text here",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_index": 0,
  "explanation": "why this answer is correct"
}
The question should test practical knowledge, not trivia.
Do not include any markdown, backticks, or text outside the JSON.`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: "You generate concise and valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`Groq API error ${response.status}: ${errBody}`)
    }

    const payload = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }

    const text = payload.choices?.[0]?.message?.content?.trim()
    if (!text) {
      throw new Error("Groq API returned empty content")
    }

    // Strip any markdown code fences if present
    const clean = text.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean) as {
      question?: string
      options?: string[]
      correct_index?: number
      explanation?: string
    }

    if (
      !parsed.question ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      typeof parsed.correct_index !== "number" ||
      typeof parsed.explanation !== "string"
    ) {
      throw new Error("Invalid question format returned by Groq")
    }

    return {
      id: crypto.randomUUID(),
      question: parsed.question,
      options: parsed.options,
      correct_index: parsed.correct_index,
      explanation: parsed.explanation
    }
  } catch (error) {
    console.error("Groq API failed, using fallback:", error)
    return generateFallbackQuestion(skillName, difficulty)
  }
}

// Fallback when AI is unavailable — returns a self-rating question
function generateFallbackQuestion(
  skillName: string,
  difficulty: DifficultyLevel
): AssessmentQuestion {
  return {
    id: crypto.randomUUID(),
    question: `How would you rate your current knowledge of ${skillName} at the ${difficulty} level?`,
    options: [
      "I have no knowledge of this",
      "I have heard of it but cannot use it",
      "I understand it and can use it with help",
      "I am confident using this independently"
    ],
    correct_index: -1, // -1 means self-rating, no correct answer
    explanation: "Self-assessment",
    is_fallback: true
  }
}
