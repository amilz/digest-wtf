"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function RunDigestButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleRun() {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/digests/${id}/run`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-digest-run": "true"
        },
      })

      if (!response.ok) {
        throw new Error("Failed to run digest")
      }

      toast({
        title: "Digest processing",
        description: "Your digest is being processed. Check the run history for updates.",
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleRun} disabled={true}>
      <RefreshCw className="mr-2 h-4 w-4" />
      {isLoading ? "Processing..." : "Run Now"}
    </Button>
  )
}
