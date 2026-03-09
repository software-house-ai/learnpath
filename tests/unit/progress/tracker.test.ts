import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  updateProgress,
  checkModuleCompletion,
  batchProgressUpdate,
} from "@/lib/progress/tracker"

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  // Re-establish chainable defaults after resetAllMocks
  mockSupabase.from.mockReturnThis()
  mockSupabase.select.mockReturnThis()
  mockSupabase.upsert.mockReturnThis()
  mockSupabase.update.mockReturnThis()
  mockSupabase.insert.mockReturnThis()
  mockSupabase.eq.mockReturnThis()
  mockSupabase.in.mockReturnThis()
})

describe("updateProgress", () => {
  it("sets status to 'completed' when progress_percent >= 90", async () => {
    const mockRow = {
      id: "prog-1",
      user_id: "user-1",
      content_item_id: "content-1",
      status: "completed",
      progress_percent: 95,
      last_position_seconds: 500,
      time_spent_minutes: 10,
      completed_at: "2026-03-09T00:00:00.000Z",
      notes: [],
      path_module_id: null,
      created_at: "2026-03-09T00:00:00Z",
      updated_at: "2026-03-09T00:00:00Z",
    }

    mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null })

    const result = await updateProgress(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase as any,
      "user-1",
      {
        content_item_id: "content-1",
        progress_percent: 95,
        last_position_seconds: 500,
      }
    )

    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" }),
      { onConflict: "user_id,content_item_id" }
    )
    expect(result.status).toBe("completed")
    expect(result.completed_at).toBeTruthy()
  })

  it("sets status to 'in_progress' when progress_percent > 0 and < 90", async () => {
    const mockRow = {
      id: "prog-2",
      user_id: "user-1",
      content_item_id: "content-1",
      status: "in_progress",
      progress_percent: 50,
      last_position_seconds: 250,
      time_spent_minutes: 5,
      completed_at: null,
      notes: [],
      path_module_id: null,
      created_at: "2026-03-09T00:00:00Z",
      updated_at: "2026-03-09T00:00:00Z",
    }

    mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null })

    const result = await updateProgress(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase as any,
      "user-1",
      {
        content_item_id: "content-1",
        progress_percent: 50,
        last_position_seconds: 250,
      }
    )

    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "in_progress" }),
      { onConflict: "user_id,content_item_id" }
    )
    expect(result.status).toBe("in_progress")
    expect(result.completed_at).toBeNull()
  })

  it("saves last_position_seconds correctly", async () => {
    const mockRow = {
      id: "prog-3",
      user_id: "user-1",
      content_item_id: "content-1",
      status: "in_progress",
      progress_percent: 30,
      last_position_seconds: 180,
      time_spent_minutes: 3,
      completed_at: null,
      notes: [],
      path_module_id: null,
      created_at: "2026-03-09T00:00:00Z",
      updated_at: "2026-03-09T00:00:00Z",
    }

    mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null })

    await updateProgress(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase as any,
      "user-1",
      {
        content_item_id: "content-1",
        progress_percent: 30,
        last_position_seconds: 180,
      }
    )

    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ last_position_seconds: 180 }),
      { onConflict: "user_id,content_item_id" }
    )
  })
})

describe("checkModuleCompletion", () => {
  it("returns true and marks module in_progress when all required content complete but checkpoint not passed", async () => {
    // eq call order:
    // 1. .eq("path_module_id", pathModuleId) → chain
    // 2. .eq("is_required", true) → resolves with assignments
    // 3. .eq("user_id", userId) → chain
    // 4. .eq("status", "completed") → resolves with completed progress
    // 5. .eq("id", pathModuleId) → chain (before .single())
    // 6. .eq("id", pathModuleId) → resolves for update (terminal)
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // call 1: path_module_id chain
      .mockResolvedValueOnce({
        data: [{ content_item_id: "c1" }],
        error: null,
      }) // call 2: is_required terminal
      .mockReturnValueOnce(mockSupabase) // call 3: user_id chain
      .mockResolvedValueOnce({
        data: [{ content_item_id: "c1" }],
        error: null,
      }) // call 4: status terminal
      .mockReturnValueOnce(mockSupabase) // call 5: eq("id") before .single()
      .mockResolvedValueOnce({ data: null, error: null }) // call 6: update terminal

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "module-1",
        path_id: "path-1",
        module_order: 1,
        checkpoint_passed: false,
      },
      error: null,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkModuleCompletion(mockSupabase as any, "user-1", "module-1")

    expect(result).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith({ status: "in_progress" })
  })

  it("returns false when one required content item is incomplete", async () => {
    // assignments has 2 items, but completed has only 1
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // call 1: path_module_id chain
      .mockResolvedValueOnce({
        data: [{ content_item_id: "c1" }, { content_item_id: "c2" }],
        error: null,
      }) // call 2: is_required terminal
      .mockReturnValueOnce(mockSupabase) // call 3: user_id chain
      .mockResolvedValueOnce({
        data: [{ content_item_id: "c1" }], // only 1 of 2 completed
        error: null,
      }) // call 4: status terminal

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkModuleCompletion(mockSupabase as any, "user-1", "module-1")

    expect(result).toBe(false)
    expect(mockSupabase.update).not.toHaveBeenCalled()
  })
})

describe("batchProgressUpdate", () => {
  it("processes all updates and continues on individual error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})

    const mockRow = {
      id: "prog-1",
      user_id: "user-1",
      content_item_id: "content-1",
      status: "in_progress",
      progress_percent: 40,
      last_position_seconds: 200,
      time_spent_minutes: 4,
      completed_at: null,
      notes: [],
      path_module_id: null,
      created_at: "2026-03-09T00:00:00Z",
      updated_at: "2026-03-09T00:00:00Z",
    }

    // First update succeeds, second fails, third succeeds
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockRow, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "DB error", code: "DB_ERR" },
      })
      .mockResolvedValueOnce({ data: { ...mockRow, content_item_id: "content-3" }, error: null })

    const updates = [
      { content_item_id: "content-1", progress_percent: 40, last_position_seconds: 200 },
      { content_item_id: "content-2", progress_percent: 60, last_position_seconds: 300 },
      { content_item_id: "content-3", progress_percent: 20, last_position_seconds: 100 },
    ]

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      batchProgressUpdate(mockSupabase as any, "user-1", updates)
    ).resolves.toBeUndefined()

    // All 3 upsert calls attempted
    expect(mockSupabase.upsert).toHaveBeenCalledTimes(3)
    // Error was logged for the failed item
    expect(consoleErrorSpy).toHaveBeenCalledOnce()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("content-2"),
      expect.anything()
    )

    consoleErrorSpy.mockRestore()
  })
})
