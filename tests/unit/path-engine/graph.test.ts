import { describe, it, expect } from "vitest"
import { topologicalSort, buildAdjacencyList } from "@/lib/path-engine/graph"
import { CycleDetectedError } from "@/lib/path-engine/errors"
import type { GraphEdge } from "@/lib/path-engine/types"

describe("buildAdjacencyList", () => {
  it("builds a map of skill → prerequisites", () => {
    const edges: GraphEdge[] = [
      { skill_id: "B", prerequisite_skill_id: "A", strength: "required" },
      { skill_id: "C", prerequisite_skill_id: "B", strength: "required" },
    ]
    const adj = buildAdjacencyList(edges)
    expect(adj["B"]).toContain("A")
    expect(adj["C"]).toContain("B")
    expect(adj["A"]).toBeUndefined()
  })
})

describe("topologicalSort", () => {
  it("TEST 1: A→B→C chain returns A first, C last", () => {
    const skills = ["A", "B", "C"]
    const edges: GraphEdge[] = [
      { skill_id: "B", prerequisite_skill_id: "A", strength: "required" },
      { skill_id: "C", prerequisite_skill_id: "B", strength: "required" },
    ]
    const result = topologicalSort(skills, edges)
    expect(result.indexOf("A")).toBeLessThan(result.indexOf("B"))
    expect(result.indexOf("B")).toBeLessThan(result.indexOf("C"))
  })

  it("TEST 2: cycle A→B, B→A throws CycleDetectedError", () => {
    const skills = ["A", "B"]
    const edges: GraphEdge[] = [
      { skill_id: "B", prerequisite_skill_id: "A", strength: "required" },
      { skill_id: "A", prerequisite_skill_id: "B", strength: "required" },
    ]
    expect(() => topologicalSort(skills, edges)).toThrow(CycleDetectedError)
  })

  it("TEST 3: single skill with no edges returns that skill", () => {
    expect(topologicalSort(["A"], [])).toEqual(["A"])
  })

  it("TEST 4: independent skills all appear in result", () => {
    const result = topologicalSort(["A", "B", "C"], [])
    expect(result).toHaveLength(3)
    expect(result).toContain("A")
    expect(result).toContain("B")
    expect(result).toContain("C")
  })

  it("TEST 5: diamond A→B, A→C, B→D, C→D — D appears last and only once", () => {
    const skills = ["A", "B", "C", "D"]
    const edges: GraphEdge[] = [
      { skill_id: "B", prerequisite_skill_id: "A", strength: "required" },
      { skill_id: "C", prerequisite_skill_id: "A", strength: "required" },
      { skill_id: "D", prerequisite_skill_id: "B", strength: "required" },
      { skill_id: "D", prerequisite_skill_id: "C", strength: "required" },
    ]
    const result = topologicalSort(skills, edges)
    expect(result.filter(r => r === "D")).toHaveLength(1)
    expect(result.indexOf("A")).toBeLessThan(result.indexOf("D"))
    expect(result.indexOf("B")).toBeLessThan(result.indexOf("D"))
    expect(result.indexOf("C")).toBeLessThan(result.indexOf("D"))
  })

  it("TEST 6: edges pointing outside skillIds set are ignored (no phantom cycle)", () => {
    // "C" is referenced as a prerequisite but not in skillIds
    const skills = ["A", "B"]
    const edges: GraphEdge[] = [
      { skill_id: "B", prerequisite_skill_id: "A", strength: "required" },
      { skill_id: "A", prerequisite_skill_id: "C", strength: "recommended" }, // C not in set
    ]
    const result = topologicalSort(skills, edges)
    expect(result).toHaveLength(2)
    expect(result.indexOf("A")).toBeLessThan(result.indexOf("B"))
  })
})
