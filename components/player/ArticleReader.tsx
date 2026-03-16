"use client"

interface ArticleReaderProps {
  url: string
  title: string
  durationMinutes: number | null
  onMarkComplete: () => void
}

export default function ArticleReader({ url, title, durationMinutes, onMarkComplete }: ArticleReaderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 gap-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {durationMinutes && (
        <p className="text-sm text-gray-500">Estimated reading time: {durationMinutes} min</p>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Open Article ↗
      </a>
      <button
        onClick={onMarkComplete}
        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
      >
        ✓ Mark as Read
      </button>
    </div>
  )
}
