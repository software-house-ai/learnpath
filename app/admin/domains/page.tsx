'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Domain } from '@/types/api'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/domains', label: 'Domains' },
  { href: '/admin/skills', label: 'Skills' },
  { href: '/admin/goals', label: 'Goals' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/analytics', label: 'Analytics' },
]

type DomainFormData = {
  name: string
  slug: string
  description: string
  icon_name: string
  color_hex: string
  display_order: string
  is_published: boolean
}

const EMPTY_FORM: DomainFormData = {
  name: '',
  slug: '',
  description: '',
  icon_name: '',
  color_hex: '#6366f1',
  display_order: '0',
  is_published: false,
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
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

export default function AdminDomainsPage() {
  const router = useRouter()
  const pathname = usePathname()

  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
  const [form, setForm] = useState<DomainFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Domain | null>(null)
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
        router.replace('/dashboard')
        return
      }

      await loadDomains()
    }

    init()
  }, [router])

  const loadDomains = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/domains')
      if (res.ok) {
        const json = await res.json()
        setDomains(json.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingDomain(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (domain: Domain) => {
    setEditingDomain(domain)
    setForm({
      name: domain.name,
      slug: domain.slug,
      description: domain.description ?? '',
      icon_name: domain.icon_name ?? '',
      color_hex: domain.color_hex,
      display_order: String(domain.display_order),
      is_published: domain.is_published,
    })
    setModalOpen(true)
  }

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: editingDomain ? prev.slug : slugify(value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      ...(editingDomain ? { id: editingDomain.id } : {}),
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      icon_name: form.icon_name || null,
      color_hex: form.color_hex,
      display_order: parseInt(form.display_order, 10) || 0,
      is_published: form.is_published,
    }

    try {
      const res = await fetch('/api/admin/domains', {
        method: editingDomain ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error?.message ?? 'Something went wrong', 'error')
      } else {
        showToast(editingDomain ? 'Domain updated.' : 'Domain created.', 'success')
        setModalOpen(false)
        await loadDomains()
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (domain: Domain) => {
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: domain.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error?.message ?? 'Delete failed', 'error')
      } else {
        showToast('Domain deleted.', 'success')
        setDeleteConfirm(null)
        await loadDomains()
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const handleTogglePublish = async (domain: Domain) => {
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: domain.id, is_published: !domain.is_published }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error?.message ?? 'Update failed', 'error')
      } else {
        showToast(
          domain.is_published ? 'Domain unpublished.' : 'Domain published.',
          'success'
        )
        await loadDomains()
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

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
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Domains</h1>
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            + Create Domain
          </button>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {domains.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                      No domains yet.
                    </td>
                  </tr>
                ) : (
                  domains.map((domain) => (
                    <tr key={domain.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: domain.color_hex }}
                          />
                          <span className="text-sm font-medium text-gray-900">{domain.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{domain.slug}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            domain.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {domain.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{domain.display_order}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTogglePublish(domain)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            {domain.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => openEdit(domain)}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(domain)}
                            className="text-xs font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-bold text-gray-900">
              {editingDomain ? 'Edit Domain' : 'Create Domain'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Icon Name</label>
                  <input
                    type="text"
                    value={form.icon_name}
                    onChange={(e) => setForm((p) => ({ ...p, icon_name: e.target.value }))}
                    placeholder="e.g. code"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color_hex}
                      onChange={(e) => setForm((p) => ({ ...p, color_hex: e.target.value }))}
                      className="h-9 w-12 cursor-pointer rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={form.color_hex}
                      onChange={(e) => setForm((p) => ({ ...p, color_hex: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Published
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : editingDomain ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Delete domain?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteConfirm.name}</span>? This action cannot be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
