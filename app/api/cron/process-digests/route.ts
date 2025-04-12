import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { processDigest } from "@/lib/digest-processor"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get all active digests
    const { data: digests, error: digestsError } = await supabase
      .from("digests")
      .select("*")
      .eq("active", true)

    if (digestsError) {
      console.error("Error fetching digests:", digestsError)
      return new NextResponse("Error fetching digests", { status: 500 })
    }

    if (!digests || digests.length === 0) {
      return NextResponse.json({ message: "No active digests found" })
    }

    const now = new Date()
    const processedDigests = []

    for (const digest of digests) {
      // Skip if no last run time
      if (!digest.last_run_at) {
        continue
      }

      const lastRun = new Date(digest.last_run_at)
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60)
      
      // Check if digest needs to be run based on frequency
      const shouldRun = 
        (digest.frequency === "hourly" && hoursSinceLastRun >= 1) ||
        (digest.frequency === "daily" && hoursSinceLastRun >= 24) ||
        (digest.frequency === "weekly" && hoursSinceLastRun >= 168) // 7 days

      if (shouldRun) {
        // Create a new run record
        const { data: run, error: runError } = await supabase
          .from("digest_runs")
          .insert({
            digest_id: digest.id,
            status: "queued",
            run_at: now.toISOString(),
          })
          .select()
          .single()

        if (runError) {
          console.error(`Error creating run for digest ${digest.id}:`, runError)
          continue
        }

        try {
          // Process the digest
          await processDigest(digest.id, run.id, supabase)
          processedDigests.push(digest.id)
        } catch (error) {
          console.error(`Error processing digest ${digest.id}:`, error)
        }
      }
    }

    return NextResponse.json({
      message: "Digest processing completed",
      processedDigests,
      totalDigests: digests.length,
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 