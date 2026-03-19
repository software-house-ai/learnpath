"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RawContentItem, ImportReport } from '@/lib/content/bulk-importer'

type ImportState = 'idle' | 'previewing' | 'importing' | 'done'

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    // Handle quotes in CSV values naively for this assignment scale
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    return obj
  })
}

export default function BulkImportPage() {
  const router = useRouter()
  const [uiState, setUiState] = useState<ImportState>('idle')
  const [parsedItems, setParsedItems] = useState<RawContentItem[]>([])
  const [pasteText, setPasteText] = useState('')
  const [report, setReport] = useState<ImportReport | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') router.replace('/dashboard')
    }
    checkAdmin()
  }, [router])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        if (file.name.endsWith('.json')) {
          const items = JSON.parse(content)
          setParsedItems(Array.isArray(items) ? items : [items])
        } else if (file.name.endsWith('.csv')) {
          const rawItems = parseCSV(content)
          
          const items = rawItems.map(item => ({
            ...item,
            duration_minutes: item.duration_minutes ? parseInt(item.duration_minutes, 10) : undefined,
            is_free: item.is_free ? item.is_free.toLowerCase() === 'true' : undefined,
            tags: item.tags ? item.tags.split(';').map(t => t.trim()) : undefined
          })) as unknown as RawContentItem[]

          setParsedItems(items)
        } else {
          alert('Unsupported file type. Please upload JSON or CSV.')
          return
        }
        setUiState('previewing')
      } catch (err) {
        alert('Failed to parse file: ' + err)
      }
    }
    reader.readAsText(file)
  }

  const handlePastePreview = () => {
    try {
      if (!pasteText.trim()) return
      const items = JSON.parse(pasteText)
      setParsedItems(Array.isArray(items) ? items : [items])
      setUiState('previewing')
    } catch {
      alert('Invalid JSON format in paste area.')
    }
  }

  const handleImport = async () => {
    setUiState('importing')
    try {
      const res = await fetch('/api/admin/content/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedItems })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Import failed')

      setReport(data.data)
      setUiState('done')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
      setUiState('previewing')
    }
  }

  const reset = () => {
    setUiState('idle')
    setParsedItems([])
    setPasteText('')
    setReport(null)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Bulk Import Content</h1>

      {uiState === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <p className="text-gray-600 mb-4 font-medium">Upload JSON or CSV</p>
            <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <p className="text-xs text-gray-400 mt-4 text-center">Structure must match RawContentItem interface.</p>
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold mb-2">Or Paste JSON Array</h3>
            <textarea 
              className="flex-grow w-full border rounded p-3 font-mono text-sm resize-none mb-3" 
              placeholder='[\n  {\n    "title": "Example",\n    "url": "https://..."\n  }\n]'
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
            />
            <button 
              onClick={handlePastePreview}
              disabled={!pasteText.trim()}
              className="bg-gray-800 text-white py-2 rounded hover:bg-gray-900 disabled:opacity-50"
            >
              Parse Preview
            </button>
          </div>
        </div>
      )}

      {uiState === 'previewing' && (
        <div className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{parsedItems.length} Items Ready to Import</h2>
            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Import All</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 whitespace-nowrap">Title</th>
                  <th className="p-3">Skill ID/Slug</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">URL</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.slice(0, 10).map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3 font-medium truncate max-w-[200px]" title={item.title}>{item.title}</td>
                    <td className="p-3">{item.skill_id || item.skill_slug || <span className="text-red-500">Missing</span>}</td>
                    <td className="p-3">{item.content_type}</td>
                    <td className="p-3">{item.difficulty_level}</td>
                    <td className="p-3 truncate max-w-[200px] text-blue-600" title={item.url}>{item.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedItems.length > 10 && (
              <p className="text-center text-gray-500 text-sm mt-4 italic">Showing first 10 rows only...</p>
            )}
          </div>
        </div>
      )}

      {uiState === 'importing' && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded shadow">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-lg text-gray-700">Processing {parsedItems.length} items...</p>
          <p className="text-gray-500 mt-2">Checking duplicates, mapping skills, and inserting arrays.</p>
        </div>
      )}

      {uiState === 'done' && report && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Import Results</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 p-4 border border-green-200 rounded">
              <div className="text-4xl font-black text-green-600 mb-1">{report.imported}</div>
              <div className="text-green-800 font-medium">✅ Successfully Imported</div>
            </div>
            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded">
              <div className="text-4xl font-black text-yellow-600 mb-1">{report.skipped}</div>
              <div className="text-yellow-800 font-medium">⏭️ Skipped (Duplicates)</div>
            </div>
            <div className="bg-red-50 p-4 border border-red-200 rounded">
              <div className="text-4xl font-black text-red-600 mb-1">{report.failed}</div>
              <div className="text-red-800 font-medium">❌ Failed Validations</div>
            </div>
          </div>

          {report.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded max-h-60 overflow-y-auto mb-6">
              <h4 className="font-bold text-red-800 mb-2 border-b border-red-200 pb-2">Error Details</h4>
              <ul className="list-disc pl-5 text-red-700 text-sm space-y-1">
                {report.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-start">
            <button onClick={reset} className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 shadow">
              Import Another File
            </button>
            <button onClick={() => router.push('/admin/content')} className="ml-4 px-6 py-2 text-blue-600 hover:underline">
              View Content Table →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
