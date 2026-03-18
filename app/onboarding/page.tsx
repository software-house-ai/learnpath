"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import GoalSelector from "@/components/onboarding/GoalSelector"
import ExperienceStep from "@/components/onboarding/ExperienceStep"
import AssessmentQuestion from "@/components/onboarding/AssessmentQuestion"
import SkillMapResult from "@/components/onboarding/SkillMapResult"
import ContextForm from "@/components/onboarding/ContextForm"
import type { AssessedLevel } from "@/types/api"

interface AssessmentQuestionData {
  id: string
  question: string
  options: string[]
  correct_index: number
  is_fallback?: boolean
}

interface ContextData {
  hours_per_week: number
  deadline: string | null
  reason: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [selectedGoalTitle, setSelectedGoalTitle] = useState<string>("")
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null)

  // Step 3 - Assessment state
  const [assessmentSessionId, setAssessmentSessionId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestionData | null>(null)
  const [currentSkillName, setCurrentSkillName] = useState("")
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0)
  const [totalSkills, setTotalSkills] = useState(0)
  const [assessmentResults, setAssessmentResults] = useState<Record<string, AssessedLevel>>({})
  const [skillMapData, setSkillMapData] = useState<Record<string, { skill_name: string; assessed_level: AssessedLevel; confidence_score: number }> | null>(null)
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false)

  // Common state
  const [sessionChecked, setSessionChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
      } else {
        setSessionChecked(true)
      }
    })
  }, [router])

  const startAssessment = useCallback(async () => {
    if (!selectedGoalId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/assessment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: selectedGoalId })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Failed to start assessment")
      }

      const { data } = await res.json()

      if (data.assessment_complete) {
        setIsAssessmentComplete(true)
        return
      }

      setAssessmentSessionId(data.session_id)
      setCurrentQuestion(data.question)
      setCurrentSkillName(data.current_skill_name)
      setCurrentSkillIndex(data.current_skill_index)
      setTotalSkills(data.total_skills)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to start assessment")
    } finally {
      setIsLoading(false)
    }
  }, [selectedGoalId])

  // Start assessment when entering Step 3
  useEffect(() => {
    if (currentStep === 3 && !assessmentSessionId && selectedGoalId && !isAssessmentComplete) {
      startAssessment()
    }
  }, [currentStep, selectedGoalId, assessmentSessionId, isAssessmentComplete, startAssessment])

  async function handleAnswer(answerIndex: number, confidence: string) {
    if (!assessmentSessionId || !currentQuestion) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/assessment/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: assessmentSessionId,
          question_id: currentQuestion.id,
          answer_index: answerIndex,
          confidence
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Failed to submit answer")
      }

      const { data } = await res.json()

      if (data.assessment_complete) {
        // Save results and show skill map
        await saveAssessmentResults(data.results, assessmentSessionId)
      } else {
        // Show next question
        setCurrentQuestion(data.question)
        setCurrentSkillName(data.current_skill_name)
        setCurrentSkillIndex(data.current_skill_index)
      }
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to submit answer")
    } finally {
      setIsLoading(false)
    }
  }

  async function saveAssessmentResults(results: Record<string, { assessed_level: AssessedLevel; confidence_score: number; responses?: Record<string, unknown>[] }>, sessionId: string) {
    try {
      const res = await fetch("/api/assessment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, results })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Failed to save results")
      }

      await res.json()

      // Transform results for display and storage
      const supabase = createClient()
      const { data: skillsData } = await supabase
        .from("skills")
        .select("id, name")

      const skillNameMap = new Map((skillsData || []).map((s: { id: string; name: string }) => [s.id, s.name]))

      const levelResults: Record<string, AssessedLevel> = {}
      const transformedResults: Record<string, { skill_name: string; assessed_level: AssessedLevel; confidence_score: number }> = {}
      Object.entries(results).forEach(([skillId, result]: [string, { assessed_level: AssessedLevel; confidence_score: number }]) => {
        levelResults[skillId] = result.assessed_level
        transformedResults[skillId] = {
          skill_name: skillNameMap.get(skillId) || skillId,
          assessed_level: result.assessed_level,
          confidence_score: result.confidence_score
        }
      })

      setAssessmentResults(levelResults)
      setSkillMapData(transformedResults)
      setIsAssessmentComplete(true)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to save assessment")
    }
  }

  async function handleContextSubmit(contextData: ContextData) {
    if (!selectedGoalId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_id: selectedGoalId,
          assessment_results: assessmentResults,
          context: contextData
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Failed to complete onboarding")
      }

      const { data } = await res.json()
      router.push(data.redirect_url)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  if (!sessionChecked) {
    return null
  }

  const canContinue =
    currentStep === 1
      ? selectedGoalId !== null
      : currentStep === 2
        ? experienceLevel !== null
        : currentStep === 3
          ? isAssessmentComplete
          : true

  function handleBack() {
    if (currentStep > 1) {
      if (currentStep === 3) {
        setAssessmentSessionId(null)
        setCurrentQuestion(null)
        setIsAssessmentComplete(false)
        setSkillMapData(null)
      }
      setCurrentStep((s) => (s - 1) as 1 | 2 | 3 | 4)
    }
  }

  function handleContinue() {
    if (currentStep < 4) {
      setCurrentStep((s) => (s + 1) as 1 | 2 | 3 | 4)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Progress indicator */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500 mb-3">Step {currentStep} of 4</p>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((step) => (
              <div
                key={step}
                className={
                  "h-1.5 flex-1 rounded-full transition-colors " +
                  (step <= currentStep ? "bg-blue-600" : "bg-gray-200")
                }
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="mb-8">
          {currentStep === 1 && (
            <GoalSelector
              onSelect={(goalId, goalTitle) => {
                setSelectedGoalId(goalId)
                setSelectedGoalTitle(goalTitle || "")
              }}
              selectedGoalId={selectedGoalId}
            />
          )}
          {currentStep === 2 && (
            <ExperienceStep onSelect={setExperienceLevel} selected={experienceLevel} />
          )}
          {currentStep === 3 && (
            <>
              {isLoading && !currentQuestion ? (
                <div className="flex justify-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading assessment...</p>
                  </div>
                </div>
              ) : isAssessmentComplete && skillMapData ? (
                <SkillMapResult
                  results={skillMapData}
                  goalTitle={selectedGoalTitle}
                  onContinue={() => setCurrentStep(4)}
                />
              ) : currentQuestion ? (
                <AssessmentQuestion
                  question={currentQuestion}
                  currentSkillName={currentSkillName}
                  currentSkillIndex={currentSkillIndex}
                  totalSkills={totalSkills}
                  onAnswer={handleAnswer}
                  isLoading={isLoading}
                />
              ) : null}
            </>
          )}
          {currentStep === 4 && (
            <ContextForm
              onSubmit={handleContextSubmit}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex justify-between items-center">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleContinue}
              disabled={!canContinue || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Loading...
                </>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        )}
        {currentStep === 3 && isAssessmentComplete && skillMapData && (
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
