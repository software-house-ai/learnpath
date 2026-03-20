"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface RegeneratePathButtonProps {
  pathId: string
}

export function RegeneratePathButton({ pathId }: RegeneratePathButtonProps) {
  const router = useRouter()
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch(`/api/paths/${pathId}/regenerate`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        const newPathId = data.data?.id || data.data?.path_id
        if (newPathId) {
          router.push(`/paths/${newPathId}`)
        } else {
          router.push(`/paths`)
        }
      } else {
        console.error("Failed to regenerate path")
        // Optionally handle and display error to the user
      }
    } catch (err) {
      console.error("Error during regeneration:", err)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleRegenerate}
      disabled={isRegenerating}
    >
      {isRegenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isRegenerating ? "Regenerating..." : "Regenerate Path"}
    </Button>
  )
}