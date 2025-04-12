import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Digest {
  id: string
  name: string
  description: string
  frequency: string
  active: boolean
  last_run_at: string | null
  created_at: string
}

export function DigestList({ digests }: { digests: Digest[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {digests.map((digest) => (
        <Card key={digest.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>{digest.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">{digest.description || "No description"}</CardDescription>
            </div>
            <Badge variant={digest.active ? "default" : "secondary"}>{digest.active ? "Active" : "Paused"}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                <span className="capitalize">{digest.frequency}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="mr-1 h-4 w-4" />
                <span>
                  Last run: {digest.last_run_at ? new Date(digest.last_run_at).toLocaleDateString() : "Never"}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`/dashboard/digests/${digest.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
