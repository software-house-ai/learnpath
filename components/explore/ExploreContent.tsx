"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react"
import { FilterSidebar } from "./FilterSidebar"
import { DomainGrid } from "./DomainGrid"

interface Domain {
  id: string
  name: string
  slug: string
  description: string
  icon_name: string
  color_hex: string
  skill_count: number
  goal_count: number
  difficulties?: string[]
}

interface ExploreContentProps {
  domains: Domain[]
}

export function ExploreContent({ domains }: ExploreContentProps) {
  // Currently the filters are just UI placeholders as domains don't exactly filter by these,
  // but we provide the layout to match the design requirements.
  const [activeFilters, setActiveFilters] = useState<any>(null)

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters)
  }

  // Derived filtered domains based on active filters
  const filteredDomains = domains.filter(domain => {
    if (!activeFilters) return true

    // Filter by difficulty
    if (activeFilters.difficulties && activeFilters.difficulties.length > 0) {
      if (!domain.difficulties || !domain.difficulties.some(d => activeFilters.difficulties.includes(d))) {
        return false
      }
    }

    return true
  })

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar - 1/4 width on desktop */}
      <div className="w-full md:w-1/4">
        <FilterSidebar onFilterChange={handleFilterChange} />
      </div>

      {/* Main Content - 3/4 width on desktop */}
      <div className="w-full md:w-3/4">
        {filteredDomains.length > 0 ? (
          <DomainGrid domains={filteredDomains} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  )
}
