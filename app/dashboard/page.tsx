import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { DigestList } from "@/components/digest-list"
import { createClient } from "@/lib/supabase/server"
import { DigestLimitAlert } from "@/components/digest-limit-alert"
import { MAX_DIGESTS } from "@/lib/constants"

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: digests } = await supabase
    .from("digests")
    .select("*")
    .eq("user_id", user?.id || "")
    .order("created_at", { ascending: false })

  const canCreateNewDigest = (digests?.length || 0) < MAX_DIGESTS

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {canCreateNewDigest ? (
          <Link href="/dashboard/digests/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Digest
            </Button>
          </Link>
        ) : (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Digest
          </Button>
        )}
      </div>

      {!canCreateNewDigest && (
        <DigestLimitAlert 
          currentCount={digests?.length || 0} 
          maxCount={MAX_DIGESTS} 
        />
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Digests</TabsTrigger>
          <TabsTrigger value="hourly">Hourly</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {digests && digests.length > 0 ? <DigestList digests={digests} /> : <EmptyState />}
        </TabsContent>
        <TabsContent value="hourly" className="space-y-4">
          {digests && digests.filter((d) => d.frequency === "hourly").length > 0 ? (
            <DigestList digests={digests.filter((d) => d.frequency === "hourly")} />
          ) : (
            <EmptyState frequency="hourly" />
          )}
        </TabsContent>
        <TabsContent value="daily" className="space-y-4">
          {digests && digests.filter((d) => d.frequency === "daily").length > 0 ? (
            <DigestList digests={digests.filter((d) => d.frequency === "daily")} />
          ) : (
            <EmptyState frequency="daily" />
          )}
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          {digests && digests.filter((d) => d.frequency === "weekly").length > 0 ? (
            <DigestList digests={digests.filter((d) => d.frequency === "weekly")} />
          ) : (
            <EmptyState frequency="weekly" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ frequency }: { frequency?: string }) {
  const frequencyText = frequency ? `${frequency} ` : ""

  return (
    <Card>
      <CardHeader>
        <CardTitle>No {frequencyText}digests found</CardTitle>
        <CardDescription>Create your first {frequencyText}digest to start monitoring content.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <RefreshCw className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Start monitoring content</h3>
            <p className="text-muted-foreground">Create a digest to monitor search terms, X handles, and websites.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/dashboard/digests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Digest
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
