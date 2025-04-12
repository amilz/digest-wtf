import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, description, frequency, sources } = body

    if (!name || !frequency || !sources || !Array.isArray(sources) || sources.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Create digest
    const { data: digest, error: digestError } = await supabase
      .from("digests")
      .insert({
        user_id: user.id,
        name,
        description,
        frequency,
        active: true,
      })
      .select()
      .single()

    if (digestError) {
      console.error(digestError)
      return new NextResponse("Error creating digest", { status: 500 })
    }

    // Create sources
    const sourcesData = sources.map((source: any) => ({
      digest_id: digest.id,
      source_type: source.type,
      source_value: source.value,
    }))

    const { error: sourcesError } = await supabase.from("digest_sources").insert(sourcesData)

    if (sourcesError) {
      console.error(sourcesError)
      // Delete the digest if sources failed
      await supabase.from("digests").delete().eq("id", digest.id)
      return new NextResponse("Error creating digest sources", { status: 500 })
    }

    return NextResponse.json(digest)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
