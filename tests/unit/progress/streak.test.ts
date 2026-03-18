import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { updateStreak, getStreakStatus } from "@/lib/progress/streak"

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks() // resets implementations AND call records, avoiding queue bleed-over
  mockSupabase.from.mockReturnThis()
  mockSupabase.select.mockReturnThis()
  mockSupabase.insert.mockReturnThis()
  mockSupabase.update.mockReturnThis()
  mockSupabase.upsert.mockReturnThis()
  mockSupabase.eq.mockReturnThis()
  mockSupabase.in.mockReturnThis()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("updateStreak", () => {
  it("first day (no prior row) → current_streak = 1, total_days_active = 1", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-09T12:00:00Z"))

    // single() returns null (no existing row)
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })
    // insert resolves
    mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateStreak(mockSupabase as any, "user-1")

    expect(mockSupabase.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: "2026-03-09",
      total_days_active: 1,
    })
  })

  it("consecutive day (last_activity = yesterday) → streak increments by 1", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-09T12:00:00Z"))

    // eq call 1: .eq("user_id", userId) before .single() — must return this for chaining
    // eq call 2: .eq("user_id", userId) in update().eq() — terminal, resolves with result
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ data: null, error: null })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        current_streak: 5,
        longest_streak: 10,
        last_activity_date: "2026-03-08",
        total_days_active: 20,
      },
      error: null,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateStreak(mockSupabase as any, "user-1")

    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak: 6,
        last_activity_date: "2026-03-09",
        total_days_active: 21,
      })
    )
  })

  it("broken streak (last_activity = 2 days ago) → streak resets to 1", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-09T12:00:00Z"))

    // eq call 1: before .single() → chain; eq call 2: update terminal → resolves
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ data: null, error: null })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        current_streak: 5,
        longest_streak: 10,
        last_activity_date: "2026-03-07", // 2 days ago
        total_days_active: 20,
      },
      error: null,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateStreak(mockSupabase as any, "user-1")

    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak: 1,
        last_activity_date: "2026-03-09",
        total_days_active: 21,
      })
    )
  })

  it("same day called twice → streak unchanged, returns early", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-09T14:00:00Z"))

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        current_streak: 3,
        longest_streak: 7,
        last_activity_date: "2026-03-09", // same as today
        total_days_active: 15,
      },
      error: null,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateStreak(mockSupabase as any, "user-1")

    // Should NOT call update since same day
    expect(mockSupabase.update).not.toHaveBeenCalled()
  })

  it("longest_streak updates when new streak exceeds previous longest", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-09T12:00:00Z"))

    // eq call 1: before .single() → chain; eq call 2: update terminal → resolves
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ data: null, error: null })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        current_streak: 10,
        longest_streak: 10,
        last_activity_date: "2026-03-08",
        total_days_active: 30,
      },
      error: null,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateStreak(mockSupabase as any, "user-1")

    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak: 11,
        longest_streak: 11, // exceeds old longest of 10
      })
    )
  })
})

describe("getStreakStatus", () => {
  it("returns zeroed defaults when no streak row exists", async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getStreakStatus(mockSupabase as any, "user-1")

    expect(result).toEqual({
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      total_days_active: 0,
      total_minutes_learned: 0,
    })
  })
})
