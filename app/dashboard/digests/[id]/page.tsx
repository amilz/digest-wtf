import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Edit, ExternalLink, RefreshCw } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { DigestSourceList } from "@/components/digest-source-list"
import { DigestRunHistory } from "@/components/digest-run-history"
import { DeleteDigestButton } from "@/components/delete-digest-button"
import { RunDigestButton } from "@/components/run-digest-button"

export default async function DigestPage({ params }: { params: { id: string } }) {
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

  const { data: runs } = await supabase
    .from("digest_runs")
    .select("*")
    .eq("digest_id", digest.id)
    .order("run_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{digest.name}</h1>
          <p className="text-muted-foreground">{digest.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/digests/${digest.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <RunDigestButton id={digest.id} />
          <DeleteDigestButton id={digest.id} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{digest.frequency}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {digest.last_run_at ? new Date(digest.last_run_at).toLocaleDateString() : "Never"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={digest.active ? "default" : "secondary"}>{digest.active ? "Active" : "Paused"}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>
        <TabsContent value="sources" className="space-y-4">
          <DigestSourceList sources={sources || []} digestId={digest.id} />
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <DigestRunHistory runs={runs || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
