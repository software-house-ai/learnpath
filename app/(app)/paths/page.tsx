/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default async function PathsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Forward all request cookies so the API route can authorize the user
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  // Fetch paths from the API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/paths`, {
    headers: {
      Cookie: cookieHeader
    }
  })

  // Check if response is ok to avoid json parse errors on 401s if they happen again
  if (!response.ok) {
    if (response.status === 401) redirect("/login")
    throw new Error(`Failed to fetch paths: ${response.statusText}`)
  }

  const { data: paths } = await response.json()

  if (!paths || paths.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">No Learning Paths Yet</h1>
          <p className="text-gray-600 mb-6">
            Complete the onboarding to generate your first personalized learning path.
          </p>
          <Link href="/onboarding">
            <Button>Start Onboarding</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Learning Paths</h1>
        <p className="text-gray-600">Track your progress across all your learning journeys</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paths.map((path: any) => (
          <Link
            key={path.id}
            href={`/paths/${path.id}`}
            className="block group"
          >
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold group-hover:text-blue-600 transition">
                    {path.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{path.goal.title}</p>
                </div>
                <Badge variant={path.status === "active" ? "default" : "secondary"}>
                  {path.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-semibold">{path.completion_percent}%</span>
                  </div>
                  <Progress value={path.completion_percent} className="h-2" />
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>{path.completed_module_count} of {path.module_count} modules completed</p>
                  <p>{path.total_estimated_hours}h total • Finish by {new Date(path.estimated_completion_date).toLocaleDateString()}</p>
                </div>
              </div>

              <Button className="w-full mt-4" variant="outline">
                Continue Learning
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
