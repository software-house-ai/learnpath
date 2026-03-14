import { createClient } from "@/lib/supabase/server"
import type { AssessedLevel } from "@/types/api"
import type { PathInput, PathOutput, SkillWithLevels } from "./types"
import { PathGenerationError } from "./errors"
import { loadPrerequisiteGraph, topologicalSort } from "./graph"
import { selectContent, getDifficultyLevelsForAssessment } from "./content-selector"

export async function generatePath(input: PathInput): Promise<PathOutput> {
  const supabase = await createClient()

  // ── STEP 1: Load goal skills ──────────────────────────────────────────────
  const { data: goalSkills, error: gsError } = await supabase
    .from("goal_skills")
    .select("skill_id, display_order, is_core")
    .eq("goal_id", input.goal_id)
    .order("display_order")

  if (gsError || !goalSkills || goalSkills.length === 0) {
    throw new PathGenerationError("This goal has no skills configured yet.")
  }

  // ── STEP 2: Load transitive prerequisites (BFS) ───────────────────────────
  const allPrerequisiteIds = new Set<string>()
  let frontier = goalSkills.map(gs => gs.skill_id)

  while (frontier.length > 0) {
    const { data: prereqRows } = await supabase
      .from("skill_prerequisites")
      .select("skill_id, prerequisite_skill_id")
      .in("skill_id", frontier)

    const newIds: string[] = []
    for (const row of prereqRows ?? []) {
      if (!allPrerequisiteIds.has(row.prerequisite_skill_id)) {
        allPrerequisiteIds.add(row.prerequisite_skill_id)
        newIds.push(row.prerequisite_skill_id)
      }
    }
    frontier = newIds
  }

  // ── STEP 3: Deduplicate all skill IDs ────────────────────────────────────
  const allSkillIds = new Set<string>([
    ...goalSkills.map(gs => gs.skill_id),
    ...allPrerequisiteIds,
  ])

  // ── STEP 4: Assessment filtering ─────────────────────────────────────────
  const skillsWithLevels: SkillWithLevels[] = []
  let allProficient = true

  for (const skillId of allSkillIds) {
    const assessedLevel: AssessedLevel =
      input.assessment_results[skillId] ?? "not_started"
    const allowedLevels = getDifficultyLevelsForAssessment(assessedLevel)

    if (assessedLevel !== "proficient") allProficient = false

    skillsWithLevels.push({ skill_id: skillId, allowed_levels: allowedLevels })
  }

  const skillGapCount = [...allSkillIds].filter(
    id => (input.assessment_results[id] ?? "not_started") !== "proficient"
  ).length

  // If all proficient: keep all skills but use advanced content only
  // Otherwise: exclude proficient skills (allowed_levels is empty)
  const filteredSkills: SkillWithLevels[] = allProficient
    ? skillsWithLevels.map(s => ({ ...s, allowed_levels: ["advanced"] }))
    : skillsWithLevels.filter(s => s.allowed_levels.length > 0)

  // ── STEP 4b: Idempotency check — return existing path if one is active ────
  const { data: existingPath } = await supabase
    .from("paths")
    .select("id")
    .eq("user_id", input.user_id)
    .eq("goal_id", input.goal_id)
    .eq("status", "active")
    .single()

  if (existingPath) {
    return {
      path_id: existingPath.id,
      module_count: 0,
      estimated_weeks: 0,
      skill_gap_count: skillGapCount,
      warning: "You already have an active path for this goal. Returning existing path.",
    }
  }

  // ── STEP 5: Topological sort ──────────────────────────────────────────────
  const skillIdsToSort = filteredSkills.map(s => s.skill_id)
  const edges = await loadPrerequisiteGraph(skillIdsToSort, supabase)
  // CycleDetectedError propagates up — API route handles it
  const sortedSkillIds = topologicalSort(skillIdsToSort, edges)

  // ── STEP 6: Content assignment ────────────────────────────────────────────
  const contentPerSkill = new Map<string, Awaited<ReturnType<typeof selectContent>>>()
  for (const skillId of sortedSkillIds) {
    const skillEntry = filteredSkills.find(s => s.skill_id === skillId)!
    const content = await selectContent(skillId, skillEntry.allowed_levels, supabase)
    contentPerSkill.set(skillId, content)
  }

  // ── STEP 7: Module creation with week numbers ─────────────────────────────
  const hoursPerWeek =
    !input.context.hours_per_week || input.context.hours_per_week === 0
      ? 7
      : input.context.hours_per_week

  const { data: skillDetails } = await supabase
    .from("skills")
    .select("id, name, estimated_hours")
    .in("id", sortedSkillIds)

  const skillMap = new Map((skillDetails ?? []).map(s => [s.id, s]))

  let cumulativeHours = 0
  const moduleData = sortedSkillIds.map((skillId, index) => {
    const skill = skillMap.get(skillId)!
    cumulativeHours += skill.estimated_hours ?? 1
    const weekNumber = Math.ceil(cumulativeHours / hoursPerWeek)
    const content = contentPerSkill.get(skillId) ?? []
    const hasContent = content.length > 0

    return {
      skill_id: skillId,
      module_order: index + 1,
      title: hasContent ? skill.name : `${skill.name} (Content coming soon)`,
      status: index === 0 ? "available" : "locked",
      week_number: weekNumber,
      estimated_hours: skill.estimated_hours ?? 1,
      checkpoint_passed: false,
      content,
    }
  })

  // ── PERSIST — Insert path, modules, content assignments ──────────────────
  const totalHours = moduleData.reduce((sum, m) => sum + m.estimated_hours, 0)
  const estimatedWeeks = Math.ceil(totalHours / hoursPerWeek)

  const { data: pathRow, error: pathError } = await supabase
    .from("paths")
    .insert({
      user_id: input.user_id,
      goal_id: input.goal_id,
      title: "Learning Path",
      status: "active",
      total_estimated_hours: totalHours,
      metadata: { generation_input: input },
    })
    .select("id")
    .single()

  if (pathError || !pathRow) {
    throw new PathGenerationError("Failed to create path", pathError)
  }

  const modulesToInsert = moduleData.map(m => ({
    path_id: pathRow.id,
    skill_id: m.skill_id,
    module_order: m.module_order,
    title: m.title,
    status: m.status,
    week_number: m.week_number,
    estimated_hours: m.estimated_hours,
    checkpoint_passed: false,
    unlock_condition: null,
  }))

  const { data: insertedModules, error: modulesError } = await supabase
    .from("path_modules")
    .insert(modulesToInsert)
    .select("id, module_order")

  if (modulesError || !insertedModules) {
    throw new PathGenerationError("Failed to create path modules", modulesError)
  }

  // ── STEP 8: Set unlock conditions now that we have module IDs ─────────────
  const sortedInserted = [...insertedModules].sort(
    (a, b) => a.module_order - b.module_order
  )
  for (let i = 1; i < sortedInserted.length; i++) {
    await supabase
      .from("path_modules")
      .update({ unlock_condition: { requires: [sortedInserted[i - 1].id] } })
      .eq("id", sortedInserted[i].id)
  }

  // ── Insert path_content_assignments ──────────────────────────────────────
  const assignmentsToInsert: {
    path_module_id: string
    content_item_id: string
    order_in_module: number
    is_required: boolean
  }[] = []

  for (const mod of insertedModules) {
    const originalModule = moduleData.find(m => m.module_order === mod.module_order)!
    for (const content of originalModule.content) {
      assignmentsToInsert.push({
        path_module_id: mod.id,
        content_item_id: content.content_item_id,
        order_in_module: content.order_in_module,
        is_required: content.is_required,
      })
    }
  }

  if (assignmentsToInsert.length > 0) {
    const { error: assignError } = await supabase
      .from("path_content_assignments")
      .insert(assignmentsToInsert)

    if (assignError) {
      throw new PathGenerationError("Failed to assign content", assignError)
    }
  }

  // ── STEP 10: Return PathOutput ────────────────────────────────────────────
  return {
    path_id: pathRow.id,
    module_count: moduleData.length,
    estimated_weeks: estimatedWeeks,
    skill_gap_count: skillGapCount,
    ...(allProficient && { warning: "You may already know this topic" }),
  }
}
