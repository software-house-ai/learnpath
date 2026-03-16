"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import GoalSelector from "@/components/onboarding/GoalSelector"
import ExperienceStep from "@/components/onboarding/ExperienceStep"
import AssessmentStep from "@/components/onboarding/AssessmentStep"
import ContextStep, { OnboardingContext } from "@/components/onboarding/ContextStep"
import type { AssessedLevel } from "@/types/api"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null)
  
  const [assessments, setAssessments] = useState<Record<string, AssessedLevel>>({})
  const [contextData, setContextData] = useState<OnboardingContext>({
    hours_per_week: 7,
    deadline: null,
    reason: ""
  })
  
  const [sessionChecked, setSessionChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  if (!sessionChecked) {
    return null
  }

  const canContinue =
    currentStep === 1
      ? selectedGoalId !== null
      : currentStep === 2
        ? experienceLevel !== null
        : true

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as 1 | 2 | 3 | 4)
    }
  }

  async function handleContinue() {
    if (currentStep < 4) {
      setCurrentStep((s) => (s + 1) as 1 | 2 | 3 | 4)
    } else {
      await submitOnboarding()
    }
  }

  async function submitOnboarding() {
    if (!selectedGoalId) return
    setIsSubmitting(true)
    setError(null)
    
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_id: selectedGoalId,
          assessment_results: assessments,
          context: contextData
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Failed to generate path")
      }

      await res.json()
      // redirect to dashboard where path will be visible
      router.push("/dashboard")
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsSubmitting(false)
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
                className={"h-1.5 flex-1 rounded-full transition-colors " + (step <= currentStep ? "bg-blue-600" : "bg-gray-200")}
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
            <GoalSelector onSelect={setSelectedGoalId} selectedGoalId={selectedGoalId} />
          )}
          {currentStep === 2 && (
            <ExperienceStep onSelect={setExperienceLevel} selected={experienceLevel} />
          )}
          {currentStep === 3 && (
            <AssessmentStep 
              goalId={selectedGoalId} 
              assessments={assessments} 
              onChange={setAssessments} 
            />
          )}
          {currentStep === 4 && (
            <ContextStep 
              context={contextData} 
              onChange={setContextData} 
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Generating Path...
              </>
            ) : (
              currentStep === 4 ? "Finish" : "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
