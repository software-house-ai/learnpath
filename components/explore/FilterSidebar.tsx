"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void
}

interface FilterState {
  domains: string[]
  difficulties: string[]
  contentTypes: string[]
  durationRange: [number, number]
}

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    domains: [],
    difficulties: [],
    contentTypes: [],
    durationRange: [0, 180]
  })

  const difficulties = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ]

  const contentTypes = [
    { value: "video", label: "Video" },
    { value: "article", label: "Article" },
    { value: "course", label: "Course" },
    { value: "exercise", label: "Exercise" }
  ]

  const handleDifficultyChange = (value: string, checked: boolean) => {
    const newDifficulties = checked
      ? [...filters.difficulties, value]
      : filters.difficulties.filter(d => d !== value)
    
    const newFilters = { ...filters, difficulties: newDifficulties }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleContentTypeChange = (value: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.contentTypes, value]
      : filters.contentTypes.filter(t => t !== value)
    
    const newFilters = { ...filters, contentTypes: newTypes }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      domains: [],
      difficulties: [],
      contentTypes: [],
      durationRange: [0, 180] as [number, number]
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Difficulty</h4>
          <div className="space-y-2">
            {difficulties.map(diff => (
              <div key={diff.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`diff-${diff.value}`}
                  checked={filters.difficulties.includes(diff.value)}
                  onCheckedChange={(checked) =>
                    handleDifficultyChange(diff.value, checked as boolean)
                  }
                />
                <Label htmlFor={`diff-${diff.value}`} className="text-sm cursor-pointer">
                  {diff.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Content Type</h4>
          <div className="space-y-2">
            {contentTypes.map(type => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.contentTypes.includes(type.value)}
                  onCheckedChange={(checked) =>
                    handleContentTypeChange(type.value, checked as boolean)
                  }
                />
                <Label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
