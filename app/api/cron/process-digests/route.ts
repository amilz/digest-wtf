import { NextResponse } from "next/server"
import { processDigestForCron } from "@/lib/digest-processor"
import { createClient } from '@supabase/supabase-js'

// Configuration
const BATCH_SIZE = 10 // Number of digests to process in parallel
const MAX_RETRIES = 3 // Maximum number of retries for failed processing

interface Digest {
  id: string
  frequency: string
  last_run_at: string | null
  active: boolean
  user_id: string
}

interface ProcessResult {
  success: boolean
  digestId: string
  error?: Error
}

type FrequencyDigests = Record<string, Digest[]>

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
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
    const processedDigests: string[] = []
    const failedDigests: string[] = []

    // Group digests by frequency for optimized processing
    const digestsByFrequency = digests.reduce((acc, digest) => {
      // If last_run_at is null, this is a new digest that has never run
      // We should include it to be processed
      if (!digest.last_run_at) {
        if (!acc[digest.frequency]) {
          acc[digest.frequency] = []
        }
        acc[digest.frequency].push(digest)
        return acc
      }
      
      const lastRun = new Date(digest.last_run_at)
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60)
      
      const shouldRun = 
        (digest.frequency === "hourly" && hoursSinceLastRun >= 1) ||
        (digest.frequency === "daily" && hoursSinceLastRun >= 24) ||
        (digest.frequency === "weekly" && hoursSinceLastRun >= 168)
    
      if (shouldRun) {
        if (!acc[digest.frequency]) {
          acc[digest.frequency] = []
        }
        acc[digest.frequency].push(digest)
      }
      return acc
    }, {} as FrequencyDigests)

    // Process digests in batches by frequency
    for (const [frequency, frequencyDigests] of Object.entries(digestsByFrequency) as [string, Digest[]][]) {
      // Process in batches
      for (let i = 0; i < frequencyDigests.length; i += BATCH_SIZE) {
        const batch = frequencyDigests.slice(i, i + BATCH_SIZE)
        
        // Process batch in parallel with controlled concurrency
        const batchResults = await Promise.allSettled(
          batch.map(async (digest: Digest) => {
            let retries = 0
            while (retries < MAX_RETRIES) {
              try {
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
                  throw new Error(`Error creating run record: ${runError.message}`)
                }

                // Process the digest
                await processDigestForCron(digest.id, run.id, supabase, digest.user_id)
                return { success: true, digestId: digest.id } as ProcessResult
              } catch (error) {
                retries++
                if (retries === MAX_RETRIES) {
                  console.error(`Failed to process digest ${digest.id} after ${MAX_RETRIES} retries:`, error)
                  return { success: false, digestId: digest.id, error: error as Error } as ProcessResult
                }
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
              }
            }
            return { success: false, digestId: digest.id } as ProcessResult
          })
        )

        // Process results
        batchResults.forEach((result: PromiseSettledResult<ProcessResult>) => {
          if (result.status === 'fulfilled' && result.value.success) {
            processedDigests.push(result.value.digestId)
          } else {
            const digestId = result.status === 'fulfilled' ? result.value.digestId : 'unknown'
            failedDigests.push(digestId)
          }
        })

        // Add a small delay between batches to prevent overwhelming the system
        if (i + BATCH_SIZE < frequencyDigests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    return NextResponse.json({
      message: "Digest processing completed",
      processedDigests,
      failedDigests,
      totalDigests: digests.length,
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 