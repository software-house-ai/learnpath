"use client"

import { useState } from "react"

interface AssessmentQuestionProps {
  question: {
    id: string
    question: string
    options: string[]
    correct_index: number
    is_fallback?: boolean
  }
  currentSkillName: string
  currentSkillIndex: number
  totalSkills: number
  onAnswer: (answerIndex: number, confidence: string) => void
  isLoading: boolean
}

export default function AssessmentQuestion({
  question,
  currentSkillName,
  currentSkillIndex,
  totalSkills,
  onAnswer,
  isLoading
}: AssessmentQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [selectedConfidence, setSelectedConfidence] = useState<string | null>(null)

  const handleOptionSelect = (index: number) => {
    if (selectedConfidence === null) {
      setSelectedOption(index)
    }
  }

  const handleConfidenceSelect = (confidence: string) => {
    if (selectedOption !== null) {
      setSelectedConfidence(confidence)
      // Auto-submit
      onAnswer(selectedOption, confidence)
      // Reset for next question
      setTimeout(() => {
        setSelectedOption(null)
        setSelectedConfidence(null)
      }, 500)
    }
  }

  const progressPercent = ((currentSkillIndex + 1) / totalSkills) * 100

  return (
    <div className="space-y-8">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-600">
            Skill {currentSkillIndex + 1} of {totalSkills}
          </p>
          <p className="text-sm font-semibold text-gray-900">{currentSkillName}</p>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm space-y-6 transition-all duration-200">
        {/* AI Unavailable Banner */}
        {question.is_fallback && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ AI service temporarily unavailable — please self-assess your skill level
            </p>
          </div>
        )}

        {/* Question Text */}
        <div>
          <p className="text-lg font-semibold text-gray-900 leading-relaxed">
            {question.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index
            const optionLabel = String.fromCharCode(65 + index) // A, B, C, D

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={isLoading || selectedConfidence !== null}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${
                      isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"
                    }`}
                  >
                    {isSelected ? "✓" : optionLabel}
                  </div>
                  <span className="text-gray-700 pt-0.5">{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Confidence Selector */}
        {selectedOption !== null && selectedConfidence === null && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
            <p className="text-sm font-semibold text-gray-900">How confident were you?</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "not_sure", label: "Not sure" },
                { value: "pretty_sure", label: "Pretty sure" },
                { value: "certain", label: "Certain" }
              ].map(conf => (
                <button
                  key={conf.value}
                  onClick={() => handleConfidenceSelect(conf.value)}
                  disabled={isLoading}
                  className="py-2 px-3 rounded-lg border-2 border-blue-300 bg-white text-blue-700 font-medium text-sm hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {conf.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  )
}
