import { } from "react"

export interface OnboardingContext {
  hours_per_week: number
  deadline: string | null
  reason: string
}

interface ContextStepProps {
  context: OnboardingContext
  onChange: (ctx: OnboardingContext) => void
}

export default function ContextStep({ context, onChange }: ContextStepProps) {
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...context, hours_per_week: parseInt(e.target.value) || 7 })
  }

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...context, reason: e.target.value })
  }

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...context, deadline: e.target.value || null })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Customize your path</h2>
      <p className="text-gray-600 mb-6">
        Let us know a bit more about your schedule and goals so we can create the perfect timeline.
      </p>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            
          <div>
            <label className="block text-sm font-semibold mb-2">
              How many hours per week can you study?
            </label>
            <input 
              type="number" 
              min="1" 
              max="40" 
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500"
              value={context.hours_per_week}
              onChange={handleHoursChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Do you have a target deadline? (Optional)
            </label>
            <input 
              type="date"
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500"
              value={context.deadline || ""}
              onChange={handleDeadlineChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Why are you learning this? (Optional)
            </label>
            <textarea 
              rows={3}
              placeholder="e.g., I want to get a new job as a frontend developer."
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500"
              value={context.reason}
              onChange={handleReasonChange}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
