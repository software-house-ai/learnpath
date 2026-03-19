"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ContentItem } from '@/types/api'

export default function ContentHealthPage() {
  const router = useRouter()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [replacingUrlId, setReplacingUrlId] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [runningCheck, setRunningCheck] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') router.replace('/dashboard')
    }
    checkAdmin()
    fetchHealthItems()
  }, [router])

  const fetchHealthItems = async () => {
    try {
      const res = await fetch('/api/admin/content/health')
      const data = await res.json()
      if (data.data) setItems(data.data)
    } catch (err) {
      console.error('Failed to fetch health items', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id: string, action: 'mark_fixed' | 'deactivate' | 'update_url', payloadUrl?: string) => {
    if (action === 'deactivate' && !confirm('Are you sure you want to deactivate this item?')) return
    
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/content/health', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, url: payloadUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update item')
      
      setItems(items.filter(item => item.id !== id))
      if (action === 'update_url') {
        setReplacingUrlId(null)
        setNewUrl('')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setProcessingId(null)
    }
  }

  const runHealthCheck = async () => {
    setRunningCheck(true)
    try {
      const res = await fetch('/api/admin/content/health', {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to start health check')

      alert(`Health check completed! Processed: ${data.data?.processed}, Broken: ${data.data?.brokenItems}`)
      fetchHealthItems() // Refresh the list
    } catch (err: unknown) {
      alert(`Error running health check: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setRunningCheck(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Health Check</h1>
        <button
          onClick={runHealthCheck}
          disabled={runningCheck}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 disabled:opacity-50"
        >
          {runningCheck ? 'Running Check...' : 'Run Health Check Now'}
        </button>
      </div>

      <div className="bg-white rounded shadow text-center p-4 mb-6">
        <div className="text-sm text-gray-500 uppercase font-semibold">Items Needing Review</div>
        <div className={`text-4xl font-black mt-2 ${items.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
          {loading ? '-' : items.length}
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading broken links...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <span className="text-4xl mb-4">✅</span>
            <h3 className="text-xl font-bold text-gray-800">No broken content items!</h3>
            <p className="text-gray-500 mt-2">All checked links are responding properly.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">Title / Expected URL</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Skill</th>
                <th className="p-3">Last Checked</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${processingId === item.id ? 'opacity-50' : ''}`}>
                  <td className="p-3 max-w-md">
                    <div className="font-semibold">{item.title}</div>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all block mt-1">
                      {item.url}
                    </a>
                    
                    {replacingUrlId === item.id && (
                      <div className="mt-3 flex gap-2">
                        <input 
                          type="url" 
                          autoFocus
                          placeholder="Paste working URL here"
                          className="flex-grow border rounded p-1 text-sm"
                          value={newUrl}
                          onChange={e => setNewUrl(e.target.value)}
                        />
                        <button 
                          onClick={() => handleAction(item.id, 'update_url', newUrl)}
                          disabled={!newUrl || processingId === item.id}
                          className="bg-blue-600 text-white px-2 py-1 text-sm rounded disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setReplacingUrlId(null)}
                          className="bg-gray-200 text-gray-800 px-2 py-1 text-sm rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">{item.provider || '-'}</td>
                  <td className="p-3 whitespace-nowrap">{(item as ContentItem & { skills?: { name: string } }).skills?.name || '-'}</td>
                  <td className="p-3 whitespace-nowrap text-sm text-gray-600">
                    {new Date(item.last_verified_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 text-sm font-medium">
                      <button 
                        onClick={() => handleAction(item.id, 'mark_fixed')}
                        disabled={processingId === item.id || replacingUrlId === item.id}
                        className="text-green-600 hover:underline disabled:opacity-50"
                      >
                        Mark Fixed
                      </button>
                      <button 
                        onClick={() => { setReplacingUrlId(item.id); setNewUrl(item.url) }}
                        disabled={processingId === item.id}
                        className="text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Replace URL
                      </button>
                      <button 
                        onClick={() => handleAction(item.id, 'deactivate')}
                        disabled={processingId === item.id || replacingUrlId === item.id}
                        className="text-gray-500 hover:text-red-600 hover:underline transition-colors disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
