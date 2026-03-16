'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Skill } from '../skills/page'

export type Goal = {
  id: string
  title: string
  slug: string
  description: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  skills?: { id: string; name: string }[]
}

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/domains', label: 'Domains' },
  { href: '/admin/skills', label: 'Skills' },
  { href: '/admin/goals', label: 'Goals' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/analytics', label: 'Analytics' },
]

type GoalFormData = {
  title: string
  description: string
  is_published: boolean
  skills: string[]
}

const EMPTY_FORM: GoalFormData = {
  title: '',
  description: '',
  is_published: true,
  skills: [],
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {message}
    </div>
  )
}

export default function AdminGoalsPage() {
  const router = useRouter()
  const pathname = usePathname()

  const [goals, setGoals] = useState<Goal[]>([])
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Goal | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

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

      await Promise.all([loadGoals(), loadSkills()])
    }

    init()
  }, [router])

  const loadGoals = async () => {
    try {
      const res = await fetch('/api/admin/goals')
      if (res.ok) {
        const json = await res.json()
        setGoals(json.data ?? [])
      }
    } catch (err) {
      console.error('Error loading goals', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSkills = async () => {
    try {
      const res = await fetch('/api/admin/skills')
      if (res.ok) {
        const json = await res.json()
        setAvailableSkills(json.data ?? [])
      }
    } catch (err) {
      console.error('Error loading skills', err)
    }
  }

  const openCreate = () => {
    setEditingGoal(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setForm({
      title: goal.title,
      description: goal.description ?? '',
      is_published: goal.is_published,
      skills: goal.skills?.map((s) => s.id) || [],
    })
    setModalOpen(true)
  }

  const closeForm = () => {
    setModalOpen(false)
    setEditingGoal(null)
    setForm(EMPTY_FORM)
  }

  const toggleSkill = (id: string) => {
    setForm((prev) => {
      const has = prev.skills.includes(id)
      return {
        ...prev,
        skills: has
          ? prev.skills.filter((s) => s !== id)
          : [...prev.skills, id],
      }
    })
  }

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingGoal
        ? `/api/admin/goals/${editingGoal.id}`
        : '/api/admin/goals'

      const method = editingGoal ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Failed to save goal')

      showToast(`Goal successfully ${editingGoal ? 'updated' : 'created'}`, 'success')
      closeForm()
      await loadGoals()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error saving goal', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteGoal = async (id: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete goal')
      
      showToast('Goal deleted', 'success')
      setDeleteConfirm(null)
      await loadGoals()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error deleting goal', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-xl font-semibold">Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-slate-900 md:flex-row">
      <aside className="w-full border-r bg-white p-6 md:w-64 md:min-h-screen">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Admin</h2>
        <nav className="space-y-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Learning Goals</h1>
            <p className="mt-1 text-sm text-gray-500">Manage high-level learning goals and the specific skills required to achieve them.</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Add Goal
          </button>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} />}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold">Delete Goal</h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete &quot;{deleteConfirm.title}&quot;? This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={submitting}
                  className="rounded px-4 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteGoal(deleteConfirm.id)}
                  disabled={submitting}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl my-8">
              <h3 className="text-lg font-bold">
                {editingGoal ? 'Edit Goal' : 'Create Goal'}
              </h3>
              <form onSubmit={saveGoal} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="is_published"
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                    Published (visible to users)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Skills</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                    {availableSkills.map((s) => (
                      <label key={s.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={form.skills.includes(s.id)}
                          onChange={() => toggleSkill(s.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{s.name}</span>
                      </label>
                    ))}
                    {availableSkills.length === 0 && (
                      <div className="text-sm text-gray-500 italic p-2">
                        No skills available. Please create skills first.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={submitting}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Target Skills</th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {goals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                          No goals found. Create one to get started!
                        </td>
                      </tr>
                    ) : (
                      goals.map((goal) => (
                        <tr key={goal.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {goal.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              goal.is_published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {goal.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {goal.skills?.length 
                              ? goal.skills.map(s => s.name).join(', ') 
                              : '-'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => openEdit(goal)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(goal)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}