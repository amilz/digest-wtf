import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DigestLimitAlert } from "@/components/digest-limit-alert"
import { DigestForm } from "@/components/digest-form"
import { MAX_DIGESTS } from "@/lib/constants"

export default async function NewDigestPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: digests } = await supabase
    .from("digests")
    .select("*")
    .eq("user_id", user.id)

  const canCreateNewDigest = (digests?.length || 0) < MAX_DIGESTS

  if (!canCreateNewDigest) {
    return (
      <div className="container py-6">
        <DigestLimitAlert 
          currentCount={digests?.length || 0} 
          maxCount={MAX_DIGESTS} 
        />
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Digest</h1>
          <p className="text-muted-foreground">Configure your digest to monitor content from various sources.</p>
        </div>
        <DigestForm />
      </div>
    </div>
  )
}
