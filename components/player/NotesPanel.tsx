"use client"
import { useState } from "react"

export interface Note {
  timestamp_seconds: number
  note_text: string
  created_at: string
}

interface NotesPanelProps {
  notes: Note[]
  currentSeconds: number
  onAddNote: (note: Note) => void
  isOpen: boolean
  onToggle: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function NotesPanel({ notes, currentSeconds, onAddNote, isOpen, onToggle }: NotesPanelProps) {
  const [newNoteText, setNewNoteText] = useState("")

  const handleAddNote = () => {
    if (!newNoteText.trim()) return
    const note: Note = {
      timestamp_seconds: currentSeconds,
      note_text: newNoteText.trim(),
      created_at: new Date().toISOString()
    }
    onAddNote(note)
    setNewNoteText("")
  }

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-l-lg p-2 cursor-pointer z-40" onClick={onToggle}>
        <span className="[writing-mode:vertical-rl] font-medium text-gray-700 py-4">Notes</span>
      </div>
    )
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-white h-full flex flex-col z-40 relative">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Notes</h3>
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="p-4 border-b border-gray-200 flex flex-col gap-2">
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Type a note..."
          className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
        />
        <button
          onClick={handleAddNote}
          className="bg-blue-600 text-white rounded-md py-1.5 text-sm font-medium hover:bg-blue-700"
        >
          Add Note at {formatTime(currentSeconds)}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notes.map((note, i) => (
          <div key={i} className="text-sm border-b border-gray-100 pb-2">
            <span className="text-gray-500 font-mono mr-2">[{formatTime(note.timestamp_seconds)}]</span>
            <span className="text-gray-900">{note.note_text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
