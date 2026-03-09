import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Profile } from "@/types/api"
import Image from "next/image"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const profile = profileData as Profile | null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name ?? "Avatar"}
                width={64}
                height={64}
                className="rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900">{profile?.full_name ?? "—"}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex justify-between py-3">
              <span className="text-sm font-medium text-gray-500">Daily learning goal</span>
              <span className="text-sm text-gray-900">
                {profile?.daily_learning_goal_minutes ?? 30} min/day
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-sm font-medium text-gray-500">Subscription</span>
              <span className="text-sm text-gray-900 capitalize">
                {profile?.subscription_status ?? "free"}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-sm font-medium text-gray-500">Account role</span>
              <span className="text-sm text-gray-900 capitalize">{profile?.role ?? "user"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
