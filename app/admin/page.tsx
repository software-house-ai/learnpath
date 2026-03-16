'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/domains', label: 'Domains' },
  { href: '/admin/skills', label: 'Skills' },
  { href: '/admin/goals', label: 'Goals' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/analytics', label: 'Analytics' },
]

type Stats = {
  totalUsers: number
  totalContentItems: number
  activePaths: number
  completionRate: number
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200 animate-pulse">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-2 h-8 w-20 rounded bg-gray-200" />
    </div>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }

      try {
        const res = await fetch('/api/admin/analytics')
        if (res.ok) {
          const json = await res.json()
          setStats(json.data)
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-gray-900 text-white">
        <div className="px-6 py-5">
          <span className="text-lg font-bold tracking-tight">LearnPath</span>
          <span className="ml-2 rounded bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold">
            Admin
          </span>
        </div>
        <nav className="mt-2 space-y-0.5 px-3 pb-6">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Dashboard</h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : stats ? (
            <>
              <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} />
              <StatCard label="Total Content Items" value={stats.totalContentItems.toLocaleString()} />
              <StatCard label="Active Paths" value={stats.activePaths.toLocaleString()} />
              <StatCard
                label="Completion Rate"
                value={`${Math.round(stats.completionRate * 100)}%`}
              />
            </>
          ) : (
            <p className="col-span-4 text-sm text-gray-500">
              Could not load stats.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
