import { DigestForm } from "@/components/digest-form"

export default function NewDigestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Digest</h1>
        <p className="text-muted-foreground">Configure your digest to monitor content from various sources.</p>
      </div>

      <DigestForm />
    </div>
  )
}
