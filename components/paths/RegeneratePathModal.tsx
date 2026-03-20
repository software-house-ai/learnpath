"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"

interface RegeneratePathModalProps {
  pathId: string
  isOpen: boolean
  onClose: () => void
}

export function RegeneratePathModal({ pathId, isOpen, onClose }: RegeneratePathModalProps) {
  const router = useRouter()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError(null)

    try {
      const response = await fetch(`/api/paths/${pathId}/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        let errorMessage = "Failed to regenerate path"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorMessage
        } catch {
          // Ignore json parse error on failed requests
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Regenerate Result:", result)
      
      const newPathId = result?.data?.path_id
      
      if (!newPathId) {
        throw new Error("No path ID returned from regeneration")
      }
      
      if (newPathId === pathId) {
        // Technically it might return the same if all proficiency constraints are identical, but we still reload
        onClose()
        router.refresh()
        return
      }

      onClose()
      
      // small delay to let modal close gracefully
      setTimeout(() => {
        router.push(`/paths/${newPathId}`)
        router.refresh()
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsRegenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-600" size={24} />
            Regenerate Learning Path?
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-4">
            <p>
              This will create a new learning path based on your current skill assessments.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>What will happen:</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Your current path will be archived</li>
                <li>A new path will be generated with updated content</li>
                <li>Your progress on individual resources will be preserved</li>
                <li>Skills you&apos;ve already mastered will be skipped</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              This is useful if you&apos;ve completed additional assessments or if your learning goals have changed.
            </p>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Regenerating...
              </>
            ) : (
              "Regenerate Path"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
