import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface DigestLimitAlertProps {
  currentCount: number
  maxCount: number
}

export function DigestLimitAlert({ currentCount, maxCount }: DigestLimitAlertProps) {
  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>Digest Limit Reached</AlertTitle>
      <AlertDescription>
        You've reached the maximum number of digests ({currentCount}/{maxCount}). 
        Please delete an existing digest to create a new one.
      </AlertDescription>
    </Alert>
  )
} 