import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Twitter, Globe } from "lucide-react"

interface DigestSource {
  id: string
  source_type: string
  source_value: string
}

export function DigestSourceList({
  sources,
  digestId,
}: {
  sources: DigestSource[]
  digestId: string
}) {
  const groupedSources = sources.reduce(
    (acc, source) => {
      const type = source.source_type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(source)
      return acc
    },
    {} as Record<string, DigestSource[]>,
  )

  if (sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No sources found</CardTitle>
          <CardDescription>This digest doesn't have any sources configured.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(groupedSources).map(([type, typeSources]) => (
        <Card key={type}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {getSourceIcon(type)}
              <CardTitle className="capitalize">{formatSourceType(type)}</CardTitle>
            </div>
            <CardDescription>
              {typeSources.length} {typeSources.length === 1 ? "source" : "sources"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {typeSources.map((source) => (
                <li key={source.id} className="text-sm">
                  {formatSourceValue(source.source_type, source.source_value)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getSourceIcon(type: string) {
  switch (type) {
    case "search_term":
      return <Search className="h-5 w-5 text-primary" />
    case "x_handle":
    case "x_hashtag":
      return <Twitter className="h-5 w-5 text-primary" />
    case "website":
      return <Globe className="h-5 w-5 text-primary" />
    default:
      return null
  }
}

function formatSourceType(type: string): string {
  return type.replace("_", " ")
}

function formatSourceValue(type: string, value: string): string {
  switch (type) {
    case "x_handle":
      return value.startsWith("@") ? value : `@${value}`
    case "x_hashtag":
      return value.startsWith("#") ? value : `#${value}`
    default:
      return value
  }
}
