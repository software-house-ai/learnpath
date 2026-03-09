"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import GoalSelector from "@/components/onboarding/GoalSelector"
import ExperienceStep from "@/components/onboarding/ExperienceStep"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)

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
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">
          {currentStep === 1 && (
            <GoalSelector onSelect={setSelectedGoalId} selectedGoalId={selectedGoalId} />
          )}
          {currentStep === 2 && (
            <ExperienceStep onSelect={setExperienceLevel} selected={experienceLevel} />
          )}
          {currentStep === 3 && (
            <div className="text-center py-16 text-gray-500 text-lg">
              Assessment coming soon
            </div>
          )}
          {currentStep === 4 && (
            <div className="text-center py-16 text-gray-500 text-lg">
              Context form coming soon
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors"
          >
            {currentStep === 4 ? "Finish" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  )
}
