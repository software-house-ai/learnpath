"use client"
import { useState } from "react"
import type { ApiSuccess, ApiError } from "@/types/api"

export interface CheckpointQuestion {
  question_id: string
  question_text: string
  options: string[]
}

export interface CheckpointResult {
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

interface CheckpointQuizProps {
  moduleId: string
  questions: CheckpointQuestion[]
  onClose: () => void
  onPass: () => void
}

export default function CheckpointQuiz({ moduleId, questions, onClose, onPass }: CheckpointQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<{ question_id: string; selected_index: number }>>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [result, setResult] = useState<CheckpointResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screen, setScreen] = useState<"quiz" | "pass" | "fail">("quiz")

  const currentQuestion = questions[currentQuestionIndex]

  const handleNext = async () => {
    if (selectedIndex === null) return
    const newAnswers = [...answers, { question_id: currentQuestion.question_id, selected_index: selectedIndex }]
    setAnswers(newAnswers)
    setSelectedIndex(null)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setIsSubmitting(true)
      try {
        const res = await fetch(`/api/checkpoint/${moduleId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: newAnswers })
        })
        const data = await res.json()
        if (data.data) {
          setResult(data.data)
          setScreen(data.data.passed ? "pass" : "fail")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleRetry = () => {
    setCurrentQuestionIndex(0)
    setAnswers([])
    setSelectedIndex(null)
    setResult(null)
    setScreen("quiz")
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {screen === "quiz" && currentQuestion && (
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4 font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <h3 className="text-xl font-bold text-gray-900 mb-6">{currentQuestion.question_text}</h3>
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedIndex === i
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={handleNext}
              disabled={selectedIndex === null || isSubmitting}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
            >
              {isSubmitting ? "Submitting..." : currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"}
            </button>
          </div>
        )}

        {screen === "pass" && result && (
          <div className="p-8 text-center bg-green-50">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">You passed! Score: {result.score_percent}%</h2>
            <p className="text-green-700 mb-8">
              {result.correct_count} of {result.total} correct
            </p>
            <button
              onClick={() => { onPass(); onClose(); }}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition"
            >
              Unlock Next Module
            </button>
          </div>
        )}

        {screen === "fail" && result && (
          <div className="p-8 text-center bg-red-50">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✗
            </div>
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Score: {result.score_percent}% — You need 60% to pass
            </h2>
            <p className="text-red-700 mb-8">Keep going! Review the material and try again.</p>
            <button
              onClick={handleRetry}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="mt-4 block w-full text-red-600 font-medium hover:underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
