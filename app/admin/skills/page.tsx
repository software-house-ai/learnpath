'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Domain } from '@/types/api'

// Define Skill type based on previous steps
export type Skill = {
  id: string
  domain_id: string
  name: string
  slug: string
  description: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  prerequisites?: { id: string; name: string }[]
}

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/domains', label: 'Domains' },
  { href: '/admin/skills', label: 'Skills' },
  { href: '/admin/goals', label: 'Goals' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/analytics', label: 'Analytics' },
]

type SkillFormData = {
  name: string
  slug: string
  description: string
  domain_id: string
  is_published: boolean
  prerequisites: string[]
}

const EMPTY_FORM: SkillFormData = {
  name: '',
  slug: '',
  description: '',
  domain_id: '',
  is_published: true,
  prerequisites: [],
}

function Toast({
  message,
  type,
}: {
  message: string
  type: 'success' | 'error'
}) {
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

export default function AdminSkillsPage() {
  const router = useRouter()
  const pathname = usePathname()

  const [skills, setSkills] = useState<Skill[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [form, setForm] = useState<SkillFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Skill | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

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

      await Promise.all([loadSkills(), loadDomains()])
    }

    init()
  }, [router])

  const loadSkills = async () => {
    try {
      const res = await fetch('/api/admin/skills')
      if (res.ok) {
        const json = await res.json()
        setSkills(json.data ?? [])
      }
    } catch (err) {
      console.error('Error loading skills', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDomains = async () => {
    try {
      const res = await fetch('/api/admin/domains')
      if (res.ok) {
        const json = await res.json()
        setDomains(json.data ?? [])
      }
    } catch (err) {
      console.error('Error loading domains', err)
    }
  }

  const openCreate = () => {
    setEditingSkill(null)
    setForm({
      ...EMPTY_FORM,
      domain_id: domains.length > 0 ? domains[0].id : '',
    })
    setModalOpen(true)
  }

  const openEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setForm({
      name: skill.name,
      slug: skill.slug,
      description: skill.description ?? '',
      domain_id: skill.domain_id,
      is_published: skill.is_published,
      prerequisites: skill.prerequisites?.map((p) => p.id) || [],
    })
    setModalOpen(true)
  }

  const closeForm = () => {
    setModalOpen(false)
    setEditingSkill(null)
    setForm(EMPTY_FORM)
  }

  const togglePrerequisite = (id: string) => {
    setForm((prev) => {
      const has = prev.prerequisites.includes(id)
      return {
        ...prev,
        prerequisites: has
          ? prev.prerequisites.filter((p) => p !== id)
          : [...prev.prerequisites, id],
      }
    })
  }

  const saveSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingSkill
        ? `/api/admin/skills/${editingSkill.id}`
        : '/api/admin/skills'

      const method = editingSkill ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        throw new Error('Failed to save skill')
      }

      showToast(`Skill successfully ${editingSkill ? 'updated' : 'created'}`, 'success')
      closeForm()
      await loadSkills()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error saving skill', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteSkill = async (id: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/skills/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete skill')
      }
      showToast('Skill deleted', 'success')
      setDeleteConfirm(null)
      await loadSkills()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error deleting skill', 'error')
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
      {/* Navigation sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Skills</h1>
            <p className="mt-1 text-sm text-gray-500">Manage learning skills and their prerequisites.</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Add Skill
          </button>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} />}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold">Delete Skill</h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete "{deleteConfirm.name}"? This cannot be undone.
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
                  onClick={() => deleteSkill(deleteConfirm.id)}
                  disabled={submitting}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl my-8">
              <h3 className="text-lg font-bold">
                {editingSkill ? 'Edit Skill' : 'Create Skill'}
              </h3>
              <form onSubmit={saveSkill} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value
                      const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
                      setForm({ ...form, name, slug })
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <select
                    required
                    value={form.domain_id}
                    onChange={(e) => setForm({ ...form, domain_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Select a domain</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                    {skills
                      .filter((s) => s.id !== editingSkill?.id) // Prevent self-prerequisite
                      .map((s) => (
                        <label key={s.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={form.prerequisites.includes(s.id)}
                            onChange={() => togglePrerequisite(s.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{s.name}</span>
                        </label>
                      ))}
                    {skills.length <= 1 && (
                      <div className="text-sm text-gray-500 italic p-2">
                        No other skills available to add as prerequisites.
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
                    {submitting ? 'Saving...' : 'Save Skill'}
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
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Domain</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Prerequisites</th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {skills.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                          No skills found. Create one to get started!
                        </td>
                      </tr>
                    ) : (
                      skills.map((skill) => {
                        const domainName = domains.find((d) => d.id === skill.domain_id)?.name || 'Unknown'
                        return (
                          <tr key={skill.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {skill.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {domainName}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                skill.is_published 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {skill.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {skill.prerequisites?.length 
                                ? skill.prerequisites.map(p => p.name).join(', ') 
                                : '-'}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                onClick={() => openEdit(skill)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(skill)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      })
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
