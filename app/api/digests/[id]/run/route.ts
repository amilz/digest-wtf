import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { processDigest } from "@/lib/digest-processor"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) })
    const { id } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if digest exists and belongs to user
    const { data: digest, error: checkError } = await supabase
      .from("digests")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (checkError || !digest) {
      return new NextResponse("Digest not found", { status: 404 })
    }

    // Create a new run record
    const { data: run, error: runError } = await supabase
      .from("digest_runs")
      .insert({
        digest_id: id,
        status: "queued",
        run_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (runError) {
      console.error(runError)
      return new NextResponse("Error creating run record", { status: 500 })
    }

    // Process the digest (in a real app, this would be done by a background job)
    // For the MVP, we'll process it synchronously
    try {
      await processDigest(id, run.id, supabase)

      return NextResponse.json({ success: true, runId: run.id })
    } catch (error) {
      console.error("Error processing digest:", error)

      // Update run status to failed
      await supabase
        .from("digest_runs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", run.id)

      return new NextResponse("Error processing digest", { status: 500 })
    }
  } catch (error) {
    console.error("Error in run digest route");
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
