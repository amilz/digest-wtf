"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FcGoogle } from "react-icons/fc"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [accessCode, setAccessCode] = useState("")
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [error, setError] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)

  const handleGoogleLogin = async () => {
    if (!showAccessCode) {
      setShowAccessCode(true)
      return
    }

    try {
      const response = await fetch("/api/validate-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode }),
      })

      const data = await response.json()

      if (!data.valid) {
        setError(true)
        setFailedAttempts(prev => prev + 1)
        toast.error("Invalid access code")
        return
      }

      setError(false)
      setFailedAttempts(0)
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (error) {
      setError(true)
      toast.error("An error occurred. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign in to digest.wtf</CardTitle>
          <CardDescription>Create and manage your personalized content digests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAccessCode && (
            <div className="space-y-2">
              <Input
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value)
                  setError(false)
                }}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>
                    Invalid access code. {failedAttempts > 1 && `(${failedAttempts} attempts)`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <FcGoogle className="mr-2 h-4 w-4" />
            {showAccessCode ? "Continue with Google" : "Get Started"}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </CardFooter>
      </Card>
    </div>
  )
}
