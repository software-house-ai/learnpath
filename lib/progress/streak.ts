import type { SupabaseClient } from "@supabase/supabase-js"

export async function updateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0]

  const { data: streak } = await supabase
    .from("user_streaks")
    .select("current_streak, longest_streak, last_activity_date, total_days_active")
    .eq("user_id", userId)
    .single()

  if (!streak) {
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      total_days_active: 1,
    })
    return
  }

  const row = streak as {
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
    total_days_active: number
  }

  if (row.last_activity_date === today) return

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  const newStreak =
    row.last_activity_date === yesterday ? row.current_streak + 1 : 1

  await supabase
    .from("user_streaks")
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, row.longest_streak),
      last_activity_date: today,
      total_days_active: row.total_days_active + 1,
    })
    .eq("user_id", userId)
}

export async function getStreakStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  total_days_active: number
  total_minutes_learned: number
}> {
  const { data } = await supabase
    .from("user_streaks")
    .select(
      "current_streak, longest_streak, last_activity_date, total_days_active, total_minutes_learned"
    )
    .eq("user_id", userId)
    .single()

  if (!data) {
    return {
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      total_days_active: 0,
      total_minutes_learned: 0,
    }
  }

  return data as {
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
    total_days_active: number
    total_minutes_learned: number
  }
}
