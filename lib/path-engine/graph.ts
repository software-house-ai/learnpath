import type { SupabaseClient } from "@supabase/supabase-js"
import type { GraphEdge } from "./types"
import { PathGenerationError, CycleDetectedError } from "./errors"

// ─── Load prerequisite edges from DB ─────────────────────────────────────────

export async function loadPrerequisiteGraph(
  skillIds: string[],
  supabase: SupabaseClient
): Promise<GraphEdge[]> {
  const { data, error } = await supabase
    .from("skill_prerequisites")
    .select("skill_id, prerequisite_skill_id, strength")
    .in("skill_id", skillIds)

  if (error) {
    throw new PathGenerationError("Failed to load prerequisite graph", error)
  }

  return (data ?? []) as GraphEdge[]
}

// ─── Build adjacency list (skill → its prerequisites) ────────────────────────

export function buildAdjacencyList(
  edges: GraphEdge[]
): Record<string, string[]> {
  const adj: Record<string, string[]> = {}
  for (const edge of edges) {
    if (!adj[edge.skill_id]) adj[edge.skill_id] = []
    adj[edge.skill_id].push(edge.prerequisite_skill_id)
  }
  return adj
}

// ─── Kahn's topological sort ──────────────────────────────────────────────────

export function topologicalSort(
  skillIds: string[],
  edges: GraphEdge[]
): string[] {
  const skillSet = new Set(skillIds)

  // Only consider edges where BOTH endpoints are in skillIds
  const filteredEdges = edges.filter(
    e => skillSet.has(e.skill_id) && skillSet.has(e.prerequisite_skill_id)
  )

  // adjacency: skill → prerequisites it depends on
  const adj = buildAdjacencyList(filteredEdges)

  // reverse adjacency: prerequisite → skills that need it
  const reverseAdj: Record<string, string[]> = {}
  for (const skillId of skillIds) {
    reverseAdj[skillId] = []
  }
  for (const edge of filteredEdges) {
    if (!reverseAdj[edge.prerequisite_skill_id]) {
      reverseAdj[edge.prerequisite_skill_id] = []
    }
    reverseAdj[edge.prerequisite_skill_id].push(edge.skill_id)
  }

  // in-degree: number of prerequisites each skill has (within the set)
  const inDegree: Record<string, number> = {}
  for (const skillId of skillIds) {
    inDegree[skillId] = (adj[skillId] ?? []).length
  }

  // Queue starts with all nodes that have no prerequisites
  const queue: string[] = skillIds.filter(id => inDegree[id] === 0)
  const result: string[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)

    for (const dependent of (reverseAdj[node] ?? [])) {
      inDegree[dependent]--
      if (inDegree[dependent] === 0) {
        queue.push(dependent)
      }
    }
  }

  if (result.length !== skillIds.length) {
    const cycleNodes = skillIds.filter(id => !result.includes(id))
    throw new CycleDetectedError(cycleNodes)
  }

  return result
}
