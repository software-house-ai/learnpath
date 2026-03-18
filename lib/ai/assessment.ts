import { GoogleGenerativeAI } from "@google/generative-ai"
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
  // If GEMINI_API_KEY is missing, return fallback immediately
  if (!process.env.GEMINI_API_KEY) {
    return generateFallbackQuestion(skillName, difficulty)
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0 } // temperature=0 for consistency
    })

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

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Strip any markdown code fences if present
    const clean = text.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean)

    return {
      id: crypto.randomUUID(),
      question: parsed.question,
      options: parsed.options,
      correct_index: parsed.correct_index,
      explanation: parsed.explanation
    }
  } catch (error) {
    console.error("Gemini API failed, using fallback:", error)
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
