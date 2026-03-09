"use client"

interface ExperienceOption {
  value: string
  label: string
  description: string
  icon: string
}

const OPTIONS: ExperienceOption[] = [
  {
    value: "beginner",
    label: "Complete beginner",
    description: "I'm starting from scratch with no prior knowledge",
    icon: "🌱",
  },
  {
    value: "tried",
    label: "Tried before but stopped",
    description: "I've dabbled but never got very far",
    icon: "🔄",
  },
  {
    value: "some_experience",
    label: "Have some experience",
    description: "I know the basics and have built a few things",
    icon: "⚡",
  },
  {
    value: "working",
    label: "Already working in this area",
    description: "I do this professionally or very regularly",
    icon: "🚀",
  },
]

interface Props {
  onSelect: (level: string) => void
  selected: string | null
}

export default function ExperienceStep({ onSelect, selected }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What&apos;s your experience level?</h2>
      <p className="text-gray-500 mb-6">This helps us calibrate the right starting point for you</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OPTIONS.map((option) => {
          const isSelected = selected === option.value
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`text-left rounded-lg border bg-white shadow-sm p-5 transition-all hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50"
                  : "hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-hidden="true">
                  {option.icon}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
