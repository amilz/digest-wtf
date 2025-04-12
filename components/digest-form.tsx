"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DigestSourceForm } from "@/components/digest-source-form"
import { Trash } from "lucide-react"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  frequency: z.enum(["hourly","daily", "weekly"]),
  active: z.boolean(),
})

interface DigestSource {
  id?: string
  type: string
  value: string
  source_type?: string
  source_value?: string
}

interface DigestFormProps {
  digest?: {
    id?: string
    name?: string
    description?: string
    frequency?: "hourly" | "daily" | "weekly"
    active?: boolean
  }
  sources?: DigestSource[]
}

type FormValues = z.infer<typeof formSchema>

export function DigestForm({ digest, sources = [] }: DigestFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [digestSources, setDigestSources] = useState<DigestSource[]>(
    sources.map((source) => ({
      id: source.id,
      type: source.source_type || source.type,
      value: source.source_value || source.value,
    })),
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: digest?.name || "",
      description: digest?.description || "",
      frequency: digest?.frequency || "daily",
      active: digest?.active !== undefined ? digest.active : true,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (digestSources.length === 0) {
      toast({
        title: "Error",
        description: "You must add at least one source to your digest.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(digest ? `/api/digests/${digest.id}` : "/api/digests", {
        method: digest ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          sources: digestSources,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save digest")
      }

      const data = await response.json()

      toast({
        title: digest ? "Digest updated" : "Digest created",
        description: digest
          ? "Your digest has been updated successfully."
          : "Your new digest has been created successfully.",
      })

      router.push(`/dashboard/digests/${data.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function addSource(source: DigestSource) {
    setDigestSources([...digestSources, source])
  }

  function removeSource(index: number) {
    setDigestSources(digestSources.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Industry Digest" {...field} />
                  </FormControl>
                  <FormDescription>A name to identify your digest.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>How often you want to receive this digest.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="A digest to track industry news and competitor activities" {...field} />
                </FormControl>
                <FormDescription>Optional description of what this digest is for.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {digest && (
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      When active, this digest will be processed according to its schedule.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Sources</h3>
              <p className="text-sm text-muted-foreground">Add sources to monitor in your digest.</p>
            </div>

            <DigestSourceForm onAddSource={addSource} />

            {digestSources.length > 0 && (
              <div className="rounded-md border">
                <div className="p-4">
                  <h4 className="font-medium">Added Sources</h4>
                </div>
                <div className="divide-y">
                  {digestSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium capitalize">{source.type.replace("_", " ")}</p>
                        <p className="text-sm text-muted-foreground">{source.value}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSource(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : digest ? "Update Digest" : "Create Digest"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
