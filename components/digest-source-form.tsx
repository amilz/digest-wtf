"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

const formSchema = z.object({
  type: z.enum(["search_term", "x_handle", "x_hashtag", "website"]),
  value: z.string().min(1, {
    message: "Value is required.",
  }),
})

interface DigestSourceFormProps {
  onAddSource: (source: { type: string; value: string }) => void
}

export function DigestSourceForm({ onAddSource }: DigestSourceFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "search_term",
      value: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddSource(values)
    form.reset({
      type: values.type,
      value: "",
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[200px_1fr_auto]">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="search_term">Search Term</SelectItem>
                  <SelectItem value="x_handle">X Handle</SelectItem>
                  <SelectItem value="x_hashtag">X Hashtag</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input placeholder={getPlaceholder(form.getValues("type"))} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-end">
          <Button type="button" onClick={form.handleSubmit(onSubmit)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function getPlaceholder(type: string): string {
  switch (type) {
    case "search_term":
      return "Enter search term..."
    case "x_handle":
      return "@username"
    case "x_hashtag":
      return "#hashtag"
    case "website":
      return "https://example.com"
    default:
      return "Enter value..."
  }
}
