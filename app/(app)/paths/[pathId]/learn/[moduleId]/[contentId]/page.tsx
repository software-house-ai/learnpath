"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import VideoEmbed from "@/components/player/VideoEmbed"
import ArticleReader from "@/components/player/ArticleReader"
import NotesPanel, { Note } from "@/components/player/NotesPanel"
import PlayerControls from "@/components/player/PlayerControls"
import CheckpointQuiz, { CheckpointQuestion } from "@/components/player/CheckpointQuiz"
import type { ContentType, ProgressStatus, DifficultyLevel } from "@/types/api"

interface ContentItemDetail {
  id: string
  title: string
  content_type: ContentType
  url: string
  embed_url: string | null
  provider: string
  duration_minutes: number | null
  difficulty_level: DifficultyLevel
  thumbnail_url: string | null
  user_progress: {
    progress_percent: number
    last_position_seconds: number
    status: ProgressStatus
    notes: Array<{ timestamp_seconds: number; note_text: string; created_at: string }>
  } | null
}

export default function PlayerPage() {
  const router = useRouter()
  const params = useParams()
  const pathId = params.pathId as string
  const moduleId = params.moduleId as string
  const contentId = params.contentId as string

  const [content, setContent] = useState<ContentItemDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState<Note[]>([])
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false)
  const [showCheckpoint, setShowCheckpoint] = useState(false)
  const [checkpointQuestions, setCheckpointQuestions] = useState<CheckpointQuestion[]>([])
  const [moduleContentList, setModuleContentList] = useState<Array<{id: string, title: string}>>([])
  const [currentSeconds, setCurrentSeconds] = useState(0)

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/content/${contentId}`)
        const data = await res.json()
        if (data.data) {
          setContent(data.data)
          setNotes(data.data.user_progress?.notes || [])
          setCurrentSeconds(data.data.user_progress?.last_position_seconds || 0)
        }
        
        let mList = []
        try {
          const modRes = await fetch(`/api/paths/${pathId}/modules/${moduleId}/contents`)
          const modData = await modRes.json()
          mList = modData.data || []
        } catch(e) {}
        
        if (mList.length === 0 && data.data) {
          mList = [{ id: contentId, title: data.data.title }]
        }
        setModuleContentList(mList)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadContent()
  }, [contentId, pathId, moduleId])

  const handleProgressUpdate = async (percent: number, seconds: number) => {
    setCurrentSeconds(seconds)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_item_id: contentId,
          progress_percent: percent,
          last_position_seconds: seconds,
          path_module_id: moduleId,
          notes: notes
        })
      })
      if (percent >= 90) {
        // Simple mock of showing checkpoint if needed
        // setShowCheckpoint(true)
      }
    } catch(err) {
      console.error(err)
    }
  }

  const handleMarkComplete = async () => {
    await handleProgressUpdate(100, currentSeconds)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_item_id: contentId,
          progress_percent: 100,
          last_position_seconds: currentSeconds,
          path_module_id: moduleId,
          notes: notes,
          status: "completed"
        })
      })
    } catch(err) {
      console.error(err)
    }
    // Set mock questions and show checkpoint
    setCheckpointQuestions([
      {
        question_id: "q1",
        question_text: "Did you understand the content?",
        options: ["Yes", "No", "Maybe", "Partially"]
      }
    ])
    setShowCheckpoint(true)
  }

  const handleAddNote = async (note: Note) => {
    const updatedNotes = [...notes, note].sort((a,b) => a.timestamp_seconds - b.timestamp_seconds)
    setNotes(updatedNotes)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_item_id: contentId,
          progress_percent: content?.user_progress?.progress_percent || 0,
          last_position_seconds: currentSeconds,
          path_module_id: moduleId,
          notes: updatedNotes
        })
      })
    } catch(err) {
      console.error(err)
    }
  }

  const handleCheckpointPass = () => {
    setShowCheckpoint(false)
    router.push(`/dashboard`)
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>
  }

  if (!content) {
    return <div className="flex h-screen items-center justify-center"><p>Content not found</p></div>
  }

  const currentIndex = moduleContentList.findIndex(c => c.id === contentId) + 1
  const totalInModule = moduleContentList.length || 1
  const prevContentId = currentIndex > 1 ? moduleContentList[currentIndex - 2]?.id : null
  const nextContentId = currentIndex < totalInModule ? moduleContentList[currentIndex]?.id : null

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <div className="flex flex-1 overflow-hidden pb-16">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {content.content_type === "video" && content.embed_url ? (
              <VideoEmbed
                embedUrl={content.embed_url}
                contentItemId={contentId}
                durationMinutes={content.duration_minutes || 0}
                initialPositionSeconds={content.user_progress?.last_position_seconds || 0}
                onProgressUpdate={handleProgressUpdate}
                onMarkComplete={handleMarkComplete}
              />
            ) : (
               <ArticleReader
                url={content.url}
                title={content.title}
                durationMinutes={content.duration_minutes}
                onMarkComplete={handleMarkComplete}
              />
            )}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h1>
              <p className="text-gray-500">Provider: {content.provider} • Difficulty: {content.difficulty_level}</p>
            </div>
          </div>
        </div>
        
        {isNotesPanelOpen && (
          <NotesPanel
            notes={notes}
            currentSeconds={currentSeconds}
            onAddNote={handleAddNote}
            isOpen={isNotesPanelOpen}
            onToggle={() => setIsNotesPanelOpen(!isNotesPanelOpen)}
          />
        )}
        {!isNotesPanelOpen && (
          <NotesPanel
            notes={[]}
            currentSeconds={0}
            onAddNote={() => {}}
            isOpen={false}
            onToggle={() => setIsNotesPanelOpen(!isNotesPanelOpen)}
          />
        )}
      </div>

      <PlayerControls
        pathId={pathId}
        moduleId={moduleId}
        contentId={contentId}
        moduleTitle="Module Title"
        contentTitle={content.title}
        currentIndex={currentIndex || 1}
        totalInModule={totalInModule}
        prevContentId={prevContentId}
        nextContentId={nextContentId}
      />

      {showCheckpoint && (
        <CheckpointQuiz
          moduleId={moduleId}
          questions={checkpointQuestions}
          onClose={() => setShowCheckpoint(false)}
          onPass={handleCheckpointPass}
        />
      )}
    </div>
  )
}
