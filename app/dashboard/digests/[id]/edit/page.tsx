import { DigestForm } from "@/components/digest-form"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function EditDigestPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { id } = await params;

  const { data: digest } = await supabase
    .from("digests")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id || "")
    .single()

  if (!digest) {
    notFound()
  }

  const { data: sources } = await supabase
    .from("digest_sources")
    .select("*")
    .eq("digest_id", digest.id)
    .order("created_at", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Digest</h1>
        <p className="text-muted-foreground">Update your digest configuration.</p>
      </div>

      <DigestForm digest={digest} sources={sources || []} />
    </div>
  )
}
