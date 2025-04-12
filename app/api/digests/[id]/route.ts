import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { id } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, description, frequency, active, sources } = body

    if (!name || !frequency || !sources || !Array.isArray(sources)) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Check if digest exists and belongs to user
    const { data: existingDigest, error: checkError } = await supabase
      .from("digests")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (checkError || !existingDigest) {
      return new NextResponse("Digest not found", { status: 404 })
    }

    // Update digest
    const { data: digest, error: digestError } = await supabase
      .from("digests")
      .update({
        name,
        description,
        frequency,
        active: active !== undefined ? active : existingDigest.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (digestError) {
      console.error(digestError)
      return new NextResponse("Error updating digest", { status: 500 })
    }

    // Delete existing sources
    await supabase.from("digest_sources").delete().eq("digest_id", id)

    // Create new sources
    if (sources.length > 0) {
      const sourcesData = sources.map((source: any) => ({
        digest_id: id,
        source_type: source.type,
        source_value: source.value,
      }))

      const { error: sourcesError } = await supabase.from("digest_sources").insert(sourcesData)

      if (sourcesError) {
        console.error(sourcesError)
        return new NextResponse("Error updating digest sources", { status: 500 })
      }
    }

    return NextResponse.json(digest)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if digest exists and belongs to user
    const { data: existingDigest, error: checkError } = await supabase
      .from("digests")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (checkError || !existingDigest) {
      return new NextResponse("Digest not found", { status: 404 })
    }

    // Delete sources first (due to foreign key constraint)
    await supabase.from("digest_sources").delete().eq("digest_id", id)

    // Delete runs
    await supabase.from("digest_runs").delete().eq("digest_id", id)

    // Delete digest
    const { error: deleteError } = await supabase.from("digests").delete().eq("id", id)

    if (deleteError) {
      console.error(deleteError)
      return new NextResponse("Error deleting digest", { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
