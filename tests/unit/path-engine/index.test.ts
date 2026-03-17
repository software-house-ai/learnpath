import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock Supabase server client ──────────────────────────────────────────────
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}))

// ─── Base chainable mock builder ──────────────────────────────────────────────
function makeChainable(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {}
  
  // Make the chain object thenable so it can be awaited at any point
  chain.then = function (resolve: (arg: unknown) => void) {
    resolve(resolvedValue)
  }

  // Any other property access returns the chain itself
  return new Proxy(chain, {
    get(target, prop) {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        return target[prop as keyof typeof target]
      }
      return () => new Proxy(chain, this)
    },
  })
}

// ─── Build a full supabase mock by table name ─────────────────────────────────
function buildMock(tableHandlers: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => tableHandlers[table] ?? makeChainable({ data: null, error: null })),
  }
}

// ─── Shared table mocks ────────────────────────────────────────────────────────
function goalSkillsMock(skills: { skill_id: string; display_order: number; is_core: boolean }[]) {
  return makeChainable({ data: skills, error: null })
}

function prereqMock(rows: unknown[] = []) {
  return makeChainable({ data: rows, error: null })
}

function noExistingPathMock() {
  return makeChainable({ data: null, error: null })
}

function existingPathMock(id: string) {
  return makeChainable({ data: { id }, error: null })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("generatePath edge cases", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("TEST 6: goal with no skills → throws error with correct message", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server")
    vi.mocked(createAdminClient).mockReturnValue(
      buildMock({
        goal_skills: makeChainable({ data: [], error: null }),
      }) as never
    )

    const { generatePath } = await import("@/lib/path-engine/index")
    await expect(
      generatePath({
        user_id: "user-1",
        goal_id: "goal-empty",
        assessment_results: {},
        context: { hours_per_week: 7, deadline: null, reason: "test" },
      })
    ).rejects.toThrow("This goal has no skills configured yet.")
  })

  it("TEST 5: existing active path → returns existing path_id with warning", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server")
    vi.mocked(createAdminClient).mockReturnValue(
      buildMock({
        goal_skills: goalSkillsMock([{ skill_id: "s1", display_order: 1, is_core: true }]),
        skill_prerequisites: prereqMock([]),
        paths: existingPathMock("existing-path-id"),
      }) as never
    )

    const { generatePath } = await import("@/lib/path-engine/index")
    const result = await generatePath({
      user_id: "user-1",
      goal_id: "goal-1",
      assessment_results: {},
      context: { hours_per_week: 7, deadline: null, reason: "test" },
    })

    expect(result.path_id).toBe("existing-path-id")
    expect(result.warning).toContain("already have an active path")
  })

  it("TEST 4: hours_per_week = 0 → defaults to 7, estimated_weeks > 0", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server")
    vi.mocked(createAdminClient).mockReturnValue(
      buildMock({
        goal_skills: goalSkillsMock([{ skill_id: "s1", display_order: 1, is_core: true }]),
        skill_prerequisites: prereqMock([]),
        paths: noExistingPathMock(),
        content_items: makeChainable({ data: [], error: null }),
        skills: makeChainable({ data: [{ id: "s1", name: "Skill 1", estimated_hours: 7 }], error: null }),
        path_modules: makeChainable({ data: [{ id: "mod-1", module_order: 1 }], error: null }),
      }) as never
    )

    // Also mock path insert chain differently — needs insert().select().single()
    const pathInsertResult = { id: "path-1" }
    const insertMock = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({ data: pathInsertResult, error: null }),
        }),
      }),
    }
    const moduleInsertMock = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ data: [{ id: "mod-1", module_order: 1 }], error: null }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ error: null }),
      }),
    }

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "goal_skills") return goalSkillsMock([{ skill_id: "s1", display_order: 1, is_core: true }])
        if (table === "skill_prerequisites") return prereqMock([])
        if (table === "paths") return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnValue({ data: null, error: null }),
          ...insertMock,
        }
        if (table === "content_items") return makeChainable({ data: [], error: null })
        if (table === "skills") return makeChainable({ data: [{ id: "s1", name: "Skill 1", estimated_hours: 7 }], error: null })
        if (table === "path_modules") return moduleInsertMock
        return makeChainable({ data: null, error: null })
      }),
    } as never)

    const { generatePath } = await import("@/lib/path-engine/index")
    const result = await generatePath({
      user_id: "user-1",
      goal_id: "goal-1",
      assessment_results: { s1: "not_started" },
      context: { hours_per_week: 0, deadline: null, reason: "test" },
    })

    expect(result.estimated_weeks).toBeGreaterThan(0)
    expect(result.module_count).toBe(1)
  })
})
