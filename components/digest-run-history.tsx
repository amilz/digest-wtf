import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DigestRun {
  id: string
  digest_id: string
  status: "queued" | "processing" | "completed" | "failed"
  run_at: string
  completed_at: string | null
  email_sent_at: string | null
  error_message: string | null
}

export function DigestRunHistory({ runs }: { runs: DigestRun[] }) {
  if (runs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No run history</CardTitle>
          <CardDescription>This digest hasn't been processed yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run History</CardTitle>
        <CardDescription>Recent processing history for this digest.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {runs.map((run) => (
            <div key={run.id} className="flex flex-col space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(run.status)}>{run.status}</Badge>
                  <span className="text-sm text-muted-foreground">{new Date(run.run_at).toLocaleString()}</span>
                </div>
                {run.completed_at && (
                  <span className="text-xs text-muted-foreground">
                    Completed: {new Date(run.completed_at).toLocaleString()}
                  </span>
                )}
              </div>
              {run.email_sent_at && (
                <div className="text-xs text-muted-foreground">
                  Email sent: {new Date(run.email_sent_at).toLocaleString()}
                </div>
              )}
              {run.error_message && <div className="text-xs text-red-500">Error: {run.error_message}</div>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default"
    case "queued":
    case "processing":
      return "secondary"
    case "failed":
      return "destructive"
    default:
      return "outline"
  }
}
