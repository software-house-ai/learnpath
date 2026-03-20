"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ContentItem, Domain, Skill } from '@/types/api'

interface FilterState {
  domain_id: string
  skill_id: string
  content_type: string
  difficulty_level: string
  is_active: string
  needs_review: string
}

const INITIAL_FILTERS: FilterState = {
  domain_id: '', skill_id: '', content_type: '',
  difficulty_level: '', is_active: '', needs_review: ''
}

export default function ContentAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ContentItem[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number | boolean | null>>({})
  const [formTags, setFormTags] = useState('')

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') router.replace('/dashboard')
    }

    const fetchDomainsAndSkills = async () => {
      try {
        const [domRes, skillRes] = await Promise.all([
          fetch('/api/admin/domains').then(res => res.json()),
          fetch('/api/admin/skills').then(res => res.json())
        ])
        if (domRes.data) setDomains(domRes.data)
        if (skillRes.data) setSkills(skillRes.data)
      } catch (err) {
        console.error('Error fetching domains/skills:', err)
      }
    }

    checkAdmin()
    fetchDomainsAndSkills()
  }, [router])

  const fetchContent = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) p.append(k, v)
      })
      p.append('page', page.toString())
      p.append('limit', limit.toString())

      const res = await fetch(`/api/admin/content?${p.toString()}`)
      const data = await res.json()

      if (data.data) {
        setItems(data.data)
        setTotal(data.meta?.total || 0)
      }
    } catch (err) {
      console.error('Error fetching content:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page, limit])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  const handleToggleActive = async (item: ContentItem) => {
    const newActive = !item.is_active
    setItems(items.map(i => i.id === item.id ? { ...i, is_active: newActive } : i))
    try {
      await fetch(`/api/admin/content/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive })
      })
    } catch (err) {
      console.error('Failed to toggle active status:', err)
      setItems(items.map(i => i.id === item.id ? { ...i, is_active: item.is_active } : i))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) return
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' })
      if (res.ok) fetchContent()
      else alert('Failed to delete item')
    } catch (err) {
      console.error(err)
    }
  }

  const openFormModal = (item?: ContentItem) => {
    if (item) {
      setEditingItem(item)
      // Omit array fields like 'tags' from formData since formData expects primitive values
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tags, ...rest } = item
      setFormData(rest as unknown as Record<string, string | number | boolean | null>)
      setFormTags(item.tags ? item.tags.join(', ') : '')
    } else {
      setEditingItem(null)
      setFormData({
        title: '', url: '', embed_url: '', skill_id: '', content_type: 'video',
        difficulty_level: 'beginner', description: '', provider: '',
        author_name: '', duration_minutes: '', is_free: true, is_active: true,
        thumbnail_url: ''
      })
      setFormTags('')
    }
    setShowModal(true)
  }

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes as string, 10) : null,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean)
    }

    try {
      const method = editingItem ? 'PUT' : 'POST'
      const url = editingItem ? `/api/admin/content/${editingItem.id}` : '/api/admin/content'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error?.message || 'Request failed')
      
      setShowModal(false)
      fetchContent()
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const filteredSkills = filters.domain_id 
    ? skills.filter(s => s.domain_id === filters.domain_id)
    : skills

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Items Admin</h1>
        <button 
          onClick={() => openFormModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Create Content
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Domain</label>
          <select 
            className="border rounded p-2"
            value={filters.domain_id}
            onChange={(e) => {
              setFilters({ ...filters, domain_id: e.target.value, skill_id: '' })
              setPage(1)
            }}
          >
            <option value="">All Domains</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Skill</label>
          <select 
            className="border rounded p-2"
            value={filters.skill_id}
            onChange={(e) => { setFilters({ ...filters, skill_id: e.target.value }); setPage(1) }}
          >
            <option value="">All Skills</option>
            {filteredSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select 
            className="border rounded p-2"
            value={filters.content_type}
            onChange={(e) => { setFilters({ ...filters, content_type: e.target.value }); setPage(1) }}
          >
            <option value="">All Types</option>
            {['video', 'article', 'documentation', 'course', 'exercise', 'project'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Difficulty</label>
          <select 
            className="border rounded p-2"
            value={filters.difficulty_level}
            onChange={(e) => { setFilters({ ...filters, difficulty_level: e.target.value }); setPage(1) }}
          >
            <option value="">All Difficulties</option>
            {['beginner', 'intermediate', 'advanced'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Active</label>
          <select 
            className="border rounded p-2"
            value={filters.is_active}
            onChange={(e) => { setFilters({ ...filters, is_active: e.target.value }); setPage(1) }}
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Needs Review</label>
          <select 
            className="border rounded p-2"
            value={filters.needs_review}
            onChange={(e) => { setFilters({ ...filters, needs_review: e.target.value }); setPage(1) }}
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <button 
          onClick={() => { setFilters(INITIAL_FILTERS); setPage(1) }}
          className="text-gray-600 hover:underline px-2 py-2"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">Title</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Skill</th>
                <th className="p-3">Type</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 max-w-xs truncate" title={item.title}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                      {item.title}
                    </a>
                    {item.needs_review && (
                      <span className="ml-2 inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Needs Review</span>
                    )}
                  </td>
                  <td className="p-3">{item.provider || '-'}</td>
                  <td className="p-3">{(item as ContentItem & { skills?: { name: string } }).skills?.name || '-'}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-gray-200 text-sm rounded">{item.content_type}</span>
                    <span className={`ml-2 px-2 py-1 text-sm rounded ${
                      item.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                      item.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>{item.difficulty_level}</span>
                  </td>
                  <td className="p-3">
                    {item.rating_avg ? `⭐ ${item.rating_avg} (${item.rating_count})` : '-'}
                  </td>
                  <td className="p-3">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={item.is_active}
                        onChange={() => handleToggleActive(item)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                    </label>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => openFormModal(item)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No content items found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} items
        </div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >Previous</button>
          <button 
            disabled={page * limit >= total}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >Next</button>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit Content' : 'Create Content'}</h2>
            <form onSubmit={submitForm} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm mb-1">Title *</label>
                  <input required value={(formData.title as string) || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm mb-1">URL *</label>
                  <input required type="url" value={(formData.url as string) || ''} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Content Type *</label>
                  <select required value={(formData.content_type as string) || 'video'} onChange={e => setFormData({...formData, content_type: e.target.value})} className="w-full border p-2 rounded">
                    {['video', 'article', 'documentation', 'course', 'exercise', 'project'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {formData.content_type === 'video' && (
                  <div>
                    <label className="block text-sm mb-1">Embed URL</label>
                    <input type="url" value={(formData.embed_url as string) || ''} onChange={e => setFormData({...formData, embed_url: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-1">Skill *</label>
                  <select required value={(formData.skill_id as string) || ''} onChange={e => setFormData({...formData, skill_id: e.target.value})} className="w-full border p-2 rounded">
                    <option value="">Select a skill...</option>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Difficulty *</label>
                  <select required value={(formData.difficulty_level as string) || 'beginner'} onChange={e => setFormData({...formData, difficulty_level: e.target.value})} className="w-full border p-2 rounded">
                    {['beginner', 'intermediate', 'advanced'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm mb-1">Description</label>
                  <textarea rows={3} value={(formData.description as string) || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Provider (e.g. YouTube, MDN)</label>
                  <input value={(formData.provider as string) || ''} onChange={e => setFormData({...formData, provider: e.target.value})} className="w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Author Name</label>
                  <input value={(formData.author_name as string) || ''} onChange={e => setFormData({...formData, author_name: e.target.value})} className="w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Duration (minutes)</label>
                  <input type="number" min="1" value={(formData.duration_minutes as string | number) || ''} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} className="w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Thumbnail URL</label>
                  <input type="url" value={(formData.thumbnail_url as string) || ''} onChange={e => setFormData({...formData, thumbnail_url: e.target.value})} className="w-full border p-2 rounded" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm mb-1">Tags (comma-separated)</label>
                  <input value={formTags} onChange={e => setFormTags(e.target.value)} className="w-full border p-2 rounded" placeholder="react, frontend, hooks" />
                </div>

                <div className="flex gap-4 col-span-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.is_free} onChange={e => setFormData({...formData, is_free: e.target.checked})} />
                    Is Free Content
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    Is Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Content</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
