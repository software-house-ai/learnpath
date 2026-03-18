"use client"

import { useState } from "react"

interface ContextFormProps {
  onSubmit: (context: {
    hours_per_week: number
    deadline: string | null
    reason: string
  }) => void
  isLoading: boolean
}

export default function ContextForm({ onSubmit, isLoading }: ContextFormProps) {
  const [hoursPerWeek, setHoursPerWeek] = useState(7)
  const [hasDeadline, setHasDeadline] = useState(false)
  const [deadline, setDeadline] = useState("")
  const [reason, setReason] = useState("")

  // Generate minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason) {
      alert("Please select a reason for learning")
      return
    }

    onSubmit({
      hours_per_week: hoursPerWeek,
      deadline: hasDeadline && deadline ? deadline : null,
      reason
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Customize your learning path</h2>
        <p className="text-gray-600">
          Tell us about your schedule and goals so we can create the perfect timeline for you.
        </p>
      </div>

      <div className="space-y-8 bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
        {/* Hours per week slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="text-lg font-semibold text-gray-900">
              Weekly commitment
            </label>
            <p className="text-3xl font-bold text-blue-600">{hoursPerWeek}h</p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            I can spend <span className="font-semibold">{hoursPerWeek} hours per week</span> learning
          </p>
          <input
            type="range"
            min="1"
            max="20"
            value={hoursPerWeek}
            onChange={e => setHoursPerWeek(parseInt(e.target.value))}
            disabled={isLoading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1h/week</span>
            <span>20h/week</span>
          </div>
          <p className="text-xs text-gray-600 pt-2">
            📅 Estimated completion varies based on skill difficulty
          </p>
        </div>

        {/* Deadline section */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-gray-900">Target deadline</label>
            <button
              type="button"
              onClick={() => {
                setHasDeadline(!hasDeadline)
                if (hasDeadline) setDeadline("")
              }}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                hasDeadline
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50`}
            >
              {hasDeadline ? "Set" : "Flexible"}
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {hasDeadline ? "When do you want to finish this path?" : "Learn at your own pace"}
          </p>

          {hasDeadline && (
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={minDate}
              disabled={isLoading}
              required={hasDeadline}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50"
            />
          )}
        </div>

        {/* Reason dropdown */}
        <div className="space-y-4 border-t pt-6">
          <label className="block text-lg font-semibold text-gray-900">
            Why are you learning this?
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            disabled={isLoading}
            required
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50 text-gray-700"
          >
            <option value="">-- Select a reason --</option>
            <option value="job_switch">I want to switch careers</option>
            <option value="work_project">I need it for a work project</option>
            <option value="curiosity">Personal interest / curiosity</option>
            <option value="exam_prep">Preparing for an exam or certification</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !reason}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-8 py-3 text-base font-semibold transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Generating Path...
            </>
          ) : (
            <>
              Generate My Learning Path
              <span>🚀</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
