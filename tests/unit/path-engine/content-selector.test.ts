import { describe, it, expect } from "vitest"
import { scoreContent, getDifficultyLevelsForAssessment } from "@/lib/path-engine/content-selector"

const makeItem = (
  rating_avg: number,
  rating_count: number,
  completion_rate: number,
  daysOld: number
) => ({
  rating_avg,
  rating_count,
  completion_rate,
  created_at: new Date(Date.now() - daysOld * 86400000).toISOString(),
})

describe("scoreContent", () => {
  it("TEST 1: high rating+completion scores higher than low rating+completion", () => {
    const high = scoreContent(makeItem(4.5, 100, 80, 100))
    const low = scoreContent(makeItem(3.0, 100, 50, 100))
    expect(high).toBeGreaterThan(low)
  })

  it("TEST 2: item with 1 rating uses Bayesian average not raw rating", () => {
    const oneRating5Star = scoreContent(makeItem(5.0, 1, 70, 100))
    const hundredRatings45 = scoreContent(makeItem(4.5, 100, 70, 100))
    // Bayesian pulls 1-rating item down toward 3.5
    expect(hundredRatings45).toBeGreaterThan(oneRating5Star)
  })

  it("TEST 3: recent item scores higher than old item with same rating", () => {
    const recent = scoreContent(makeItem(4.0, 50, 70, 100))  // 100 days old
    const old = scoreContent(makeItem(4.0, 50, 70, 800))     // 800 days old
    expect(recent).toBeGreaterThan(old)
  })
})

describe("getDifficultyLevelsForAssessment", () => {
  it("TEST 4: proficient returns empty array", () => {
    expect(getDifficultyLevelsForAssessment("proficient")).toEqual([])
  })

  it("TEST 5: not_started returns all 3 levels", () => {
    expect(getDifficultyLevelsForAssessment("not_started")).toEqual([
      "beginner",
      "intermediate",
      "advanced",
    ])
  })

  it("TEST 6: familiar returns intermediate and advanced", () => {
    expect(getDifficultyLevelsForAssessment("familiar")).toEqual([
      "intermediate",
      "advanced",
    ])
  })

  it("TEST 7: comfortable returns advanced only", () => {
    expect(getDifficultyLevelsForAssessment("comfortable")).toEqual(["advanced"])
  })
})
