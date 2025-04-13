import { SupabaseClient } from "@supabase/supabase-js"
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { anthropic } from '@ai-sdk/anthropic';
import { Resend } from 'resend';
interface SearchSource {
  source_type: 'search_term' | 'website' | 'x_handle' | 'x_hashtag';
  source_value: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  published_at?: string;
  source_term: string;
}

interface AISearchResponse {
  content: string;
  sources: Array<SearchResult>;
}

interface DigestSummary {
  title: string;
  date: string;
  sections: Array<{
    title: string;
    items: Array<{
      title: string;
      summary: string;
      url: string;
      source_term: string;
    }>;
  }>;
}

const SAMPLE_SUMMARY: DigestSummary = {
  title: "Sample Digest",
  date: new Date().toISOString(),
  sections: [
    {
      title: "Sample Section",
      items: [
        {
          title: "Sample Item",
          summary: "Sample Summary",
          url: "https://example.com",
          source_term: "Sample Source"
        }
      ]
    }
  ]
}


export async function processDigest(digestId: string, runId: string, supabase: SupabaseClient) {
  try {
    // Update run status to processing
    await supabase
      .from("digest_runs")
      .update({
        status: "processing",
      })
      .eq("id", runId)

    // Get digest details
    const { data: digest, error: digestError } = await supabase.from("digests").select("*").eq("id", digestId).single()

    if (digestError || !digest) {
      throw new Error(`Digest not found: ${digestError?.message}`)
    }

    // Get user details
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`)
    }

    // Get digest sources
    const { data: sources, error: sourcesError } = await supabase
      .from("digest_sources")
      .select("*")
      .eq("digest_id", digestId)

    if (sourcesError) {
      throw new Error(`Error fetching sources: ${sourcesError.message}`)
    }

    if (!sources || sources.length === 0) {
      throw new Error("No sources found for digest")
    }

    // const content = await simulateContentRetrieval(sources)

    const [openAIContent, xaiContent] = await Promise.all([
      retrieveContentFromOpenAISearch(sources, {
        description: digest.description,
        frequency: digest.frequency
      }),
      retrieveContentFromXai(sources, {
        description: digest.description,
        frequency: digest.frequency
      })
    ])

    // const summary = await simulateContentSummarization([...openAIContent, ...xaiContent])
    const summary = await summarizeContentWithAnthropic([openAIContent, xaiContent])

    // Send email
    await sendDigestEmail(digest, user, summary)

    // Update digest and run
    await supabase
      .from("digests")
      .update({
        last_run_at: new Date().toISOString(),
      })
      .eq("id", digestId)

    await supabase
      .from("digest_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", runId)

    return { success: true }
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
      .eq("id", runId)

    throw error
  }
}

async function getUserEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .rpc('get_user_email_by_id', { user_id: userId });
  
  if (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
  
  return data;
}


export async function processDigestForCron(digestId: string, runId: string, supabase: SupabaseClient, user_id: string) {
  try {
    // Update run status to processing
    await supabase
      .from("digest_runs")
      .update({
        status: "processing",
      })
      .eq("id", runId)

    // Get digest details with user email
    const { data: digest, error: digestError } = await supabase
      .from("digests")
      .select("*")
      .eq("id", digestId)
      .single()

    if (digestError || !digest) {
      throw new Error(`Digest not found: ${digestError?.message}`)
    }

    const userEmail = await getUserEmail(supabase, user_id);
      
    if (!userEmail) {
      throw new Error(`User email not found`)
    }

    // Get digest sources
    const { data: sources, error: sourcesError } = await supabase
      .from("digest_sources")
      .select("*")
      .eq("digest_id", digestId)

    if (sourcesError) {
      throw new Error(`Error fetching sources: ${sourcesError.message}`)
    }

    if (!sources || sources.length === 0) {
      throw new Error("No sources found for digest")
    }

    const [openAIContent, xaiContent] = await Promise.all([
      retrieveContentFromOpenAISearch(sources, {
        description: digest.description,
        frequency: digest.frequency
      }),
      retrieveContentFromXai(sources, {
        description: digest.description,
        frequency: digest.frequency
      })
    ])

    const summary = await summarizeContentWithAnthropic([openAIContent, xaiContent])

    // Send email using the digest owner's email
    await sendDigestEmail(digest, { email: userEmail }, summary)

    // Update digest and run
    await supabase
      .from("digests")
      .update({
        last_run_at: new Date().toISOString(),
      })
      .eq("id", digestId)

    await supabase
      .from("digest_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", runId)

    return { success: true }
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
      .eq("id", runId)

    throw error
  }
}

async function simulateContentRetrieval(sources: any[]) {
  // In a real implementation, this would call Brave API and other sources
  // For the MVP, we'll return mock data


  const mockContent = [
    {
      source: "search_term",
      term: sources.find((s) => s.source_type === "search_term")?.source_value || "technology",
      results: [
        {
          title: "Latest Advancements in AI Technology",
          url: "https://example.com/ai-news",
          snippet: "Researchers have made significant breakthroughs in AI technology this week...",
        },
        {
          title: "Tech Industry Growth Continues Despite Challenges",
          url: "https://example.com/tech-industry",
          snippet: "The technology sector shows resilience amid economic uncertainties...",
        },
      ],
    },
    {
      source: "x_handle",
      handle: sources.find((s) => s.source_type === "x_handle")?.source_value || "@tech_news",
      posts: [
        {
          text: "Just announced: Our new product line will revolutionize how you interact with technology.",
          url: "https://x.com/status/123456789",
          posted_at: new Date().toISOString(),
        },
        {
          text: "Excited to share our latest research paper on machine learning applications.",
          url: "https://x.com/status/987654321",
          posted_at: new Date().toISOString(),
        },
      ],
    },
    {
      source: "website",
      url: sources.find((s) => s.source_type === "website")?.source_value || "techcrunch.com",
      articles: [
        {
          title: "Startup Raises $50M in Series B Funding",
          url: "https://example.com/startup-funding",
          published_at: new Date().toISOString(),
        },
        {
          title: "New Product Launch Disrupts Market",
          url: "https://example.com/product-launch",
          published_at: new Date().toISOString(),
        },
      ],
    },
  ]

  return mockContent
}

async function simulateOpenAiSearch(sources: SearchSource[], digest: { description?: string; frequency?: string }) {
  console.log("SOURCES", sources);
  console.log("DIGEST", digest);

  return []
}

async function retrieveContentFromGrok(sources: any[]) { }

async function retrieveContentFromBrave(sources: any[]) { }

async function retrieveContentFromOpenAISearch(sources: SearchSource[], digest: { description?: string; frequency?: string }): Promise<AISearchResponse> {
  const searchTerms = sources
    .filter(source => source.source_type === 'search_term' || source.source_type === 'website')
    .map(source => source.source_value);

  if (searchTerms.length === 0) {
    return {
      content: "",
      sources: [],
    };
  }

  try {
    const timeContext = digest.frequency ?
      `This is a ${digest.frequency} digest, so focus on information relevant to this time period.` :
      'Focus on recent and relevant information.';

    const descriptionContext = digest.description ?
      `\nAdditional context about this digest: ${digest.description}` :
      '';

    const combinedPrompt = `
      Find the latest and most relevant information about the following topics:
      ${searchTerms.map((term, index) => `${index + 1}. ${term}`).join('\n')}
      
      ${timeContext}${descriptionContext}
      
      For each topic, provide:
      1. Recent developments and news
      2. Key updates and changes
      3. Important context and background
      
      Structure the response to clearly separate information for each topic.
      Prioritize information that aligns with the digest's purpose and frequency.
    `;

    const result = await generateText({
      model: openai.responses('gpt-4o-mini'),
      prompt: combinedPrompt,
      tools: {
        web_search_preview: openai.tools.webSearchPreview({
          searchContextSize: 'high',
        }),
      },
      toolChoice: { type: 'tool', toolName: 'web_search_preview' },
    });

    // console.log("OPENAI UNPARSED RESULT", JSON.stringify(result, null, 2));

    if (!result.sources || result.sources.length === 0) {
      return {
        content: "",
        sources: [],
      };
    }

    const sources = result.sources.map(source => ({
      title: source.title || 'Untitled',
      url: source.url,
      // snippet: source.providerMetadata || '',
      published_at: new Date().toISOString(),
      source_term: searchTerms.find(term =>
        source.title?.toLowerCase().includes(term.toLowerCase()) ||
        result.text?.toLowerCase().includes(term.toLowerCase())
      ) || searchTerms[0], // Fallback to first term if no match found
    }));

    const response = {
      content: result.text,
      sources,
    }
    return response;
  } catch (error) {
    console.error('Error in OpenAI search:', error);
    return {
      content: "",
      sources: [],
    };
  }
}

async function retrieveContentFromXai(sources: SearchSource[], digest: { description?: string; frequency?: string }): Promise<AISearchResponse> {
  const searchTerms = sources
    .filter(source => source.source_type === 'search_term' || source.source_type === 'website')
    .map(source => source.source_value);

  const xHandles = sources
    .filter(source => source.source_type === 'x_handle')
    .map(source => source.source_value);

  const xHashtags = sources
    .filter(source => source.source_type === 'x_hashtag')
    .map(source => source.source_value);

  if (searchTerms.length === 0 && xHandles.length === 0) {
    return {
      content: "",
      sources: [],
    };
  }

  try {
    const timeContext = digest.frequency ?
      `This is a ${digest.frequency} digest, so focus on information relevant to this time period.` :
      'Focus on recent and relevant information.';

    const descriptionContext = digest.description ?
      `\nAdditional context about this digest: ${digest.description}` :
      '';

    const searchTermsPrompt = searchTerms.length > 0 ? `
      Find the latest and most relevant information about the following topics:
      ${searchTerms.map((term, index) => `${index + 1}. ${term}`).join('\n')}
    ` : '';

    const xHandlesPrompt = xHandles.length > 0 ? `
      Monitor and summarize recent posts from these X (Twitter) accounts:
      ${xHandles.map((handle, index) => `${index + 1}. ${handle}`).join('\n')}
    ` : '';

    const xHashtagsPrompt = xHashtags.length > 0 ? `
      Monitor and summarize recent posts from these X (Twitter) hashtags:
      ${xHashtags.map((hashtag, index) => `${index + 1}. ${hashtag}`).join('\n')}
    ` : '';

    const combinedPrompt = `
    Get me real-time data on the following inputs:
      ${searchTermsPrompt}
      ${xHandlesPrompt}
      ${xHashtagsPrompt}
      ${timeContext}${descriptionContext}
      
      For each topic and X account, provide:
      1. Recent developments and news
      2. Key updates and changes
      3. Important context and background
      
      Structure the response to clearly separate information for each topic and X account.
      Prioritize information that aligns with the digest's purpose and frequency.
    `;

    const result = await generateText({
      model: xai('grok-3-beta'),
      prompt: combinedPrompt
    });

    // console.log("XAI UNPARSED RESULT", JSON.stringify(result, null, 2));

    let sources: SearchResult[] = [];
    if (!result.sources || result.sources.length === 0) {
      sources = [];
    } else {
      sources = result.sources.map(source => ({
        title: source.title || 'Untitled',
        url: source.url,
        published_at: new Date().toISOString(),
        source_term: searchTerms.find(term =>
          source.title?.toLowerCase().includes(term.toLowerCase()) ||
          result.text?.toLowerCase().includes(term.toLowerCase())
        ) || xHandles.find(handle =>
          source.title?.toLowerCase().includes(handle.toLowerCase()) ||
          result.text?.toLowerCase().includes(handle.toLowerCase())
        ) || searchTerms[0] || xHandles[0], // Fallback to first term if no match found
      }));
    }

    return {
      content: result.text,
      sources,
    };
  } catch (error) {
    console.error('Error in XAI search:', error);
    return {
      content: "",
      sources: [],
    };
  }
}

async function simulateContentSummarization(content: any) {
  // In a real implementation, this would use Claude or another AI model
  // For the MVP, we'll return a mock summary

  return {
    title: "Your Daily Digest",
    date: new Date().toLocaleDateString(),
    sections: [
      {
        title: "Search Results",
        items: [
          {
            title: "Latest Advancements in AI Technology",
            summary:
              "Researchers have made significant breakthroughs in AI technology this week, with new models showing improved performance on complex tasks.",
            url: "https://example.com/ai-news",
          },
          {
            title: "Tech Industry Growth Continues Despite Challenges",
            summary:
              "The technology sector shows resilience amid economic uncertainties, with major companies reporting better-than-expected earnings.",
            url: "https://example.com/tech-industry",
          },
        ],
      },
      {
        title: "Social Media Updates",
        items: [
          {
            author: "@tech_news",
            content: "Just announced: Our new product line will revolutionize how you interact with technology.",
            url: "https://x.com/status/123456789",
          },
          {
            author: "@tech_news",
            content: "Excited to share our latest research paper on machine learning applications.",
            url: "https://x.com/status/987654321",
          },
        ],
      },
      {
        title: "Website Monitoring",
        items: [
          {
            source: "TechCrunch",
            title: "Startup Raises $50M in Series B Funding",
            summary:
              "A promising startup in the AI space has secured significant funding to expand its operations globally.",
            url: "https://example.com/startup-funding",
          },
          {
            source: "TechCrunch",
            title: "New Product Launch Disrupts Market",
            summary:
              "An innovative product has been launched that promises to change how businesses operate in the digital space.",
            url: "https://example.com/product-launch",
          },
        ],
      },
    ],
  }
}

async function sendDigestEmail(digest: any, user: any, summary: any) {
  // In a real implementation, this would use Resend API
  // For the MVP, we'll just log the email content

  console.log(`
    Sending digest email:
    To: ${user.email}
    Subject: ${digest.name} - ${new Date().toLocaleDateString()}
    Content: Daily digest with ${summary.sections?.reduce((total: number, section: any) => total + section.items.length, 0)} items
  `)

  // In a real implementation:
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'digest@digest.wtf',
    to: user.email,
    subject: `${digest.name} - ${new Date().toLocaleDateString()}`,
    html: generateEmailHtml(digest, summary),
  });

  return true
}

async function summarizeContentWithAnthropic(responses: AISearchResponse[]): Promise<DigestSummary> {
  try {
    // Combine all content and sources from responses
    const allContent = responses.map(r => r.content).join('\n\n');
    const allSources = responses.flatMap(r => r.sources);

    if (!allContent || allSources.length === 0) {
      return {
        title: "Daily Digest",
        date: new Date().toLocaleDateString(),
        sections: []
      };
    }

    const prompt = `
      You are an expert content summarizer. Your task is to create a concise, well-structured digest from the following content.
      
      Content to summarize:
      ${allContent}
      
      Sources:
      ${JSON.stringify(allSources, null, 2)}
      
      Create a digest with the following structure:
      1. Group content by source term/topic
      2. For each group, provide 2-3 key points
      3. Keep summaries concise (1-2 sentences per point)
      4. Maintain original URLs for reference
      5. Focus on the most important and recent information
      
      Format the response as a JSON object with this structure:
      {
        "title": "string",
        "date": "string",
        "sections": [
          {
            "title": "string",
            "items": [
              {
                "title": "string",
                "summary": "string",
                "url": "string",
                "source_term": "string"
              }
            ]
          }
        ]
      }
      
      Remember:
      - Keep it concise and scannable
      - Focus on key insights
      - Maintain original source attribution
      - Use clear, professional language
    `;

    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt,
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Parse the JSON response
    const summary = JSON.parse(result.text) as DigestSummary;

    console.log("SUMMARY", JSON.stringify(summary, null, 2));
    
    // Validate the response structure
    if (!summary.title || !summary.date || !Array.isArray(summary.sections)) {
      throw new Error('Invalid summary format from AI model');
    }

    return summary;
  } catch (error) {
    console.error('Error in summarizeContentWithAnthropic:', error);
    return {
      title: "Daily Digest",
      date: new Date().toLocaleDateString(),
      sections: []
    };
  }
}

function generateEmailHtml(digest: any, summary: DigestSummary): string {
  const totalItems = summary.sections.reduce((total, section) => total + section.items.length, 0);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${digest.name} - ${summary.date}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #111;
          }
          .header p {
            margin: 10px 0 0;
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #111;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .item {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #f5f5f5;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #111;
          }
          .item-summary {
            font-size: 14px;
            color: #444;
            margin-bottom: 8px;
          }
          .item-meta {
            font-size: 12px;
            color: #666;
          }
          .item-meta a {
            color: #0066cc;
            text-decoration: none;
          }
          .item-meta a:hover {
            text-decoration: underline;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media (max-width: 480px) {
            body {
              padding: 15px;
            }
            .header h1 {
              font-size: 20px;
            }
            .section-title {
              font-size: 16px;
            }
            .item-title {
              font-size: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${digest.name}</h1>
          <p>${summary.date} • ${totalItems} items</p>
        </div>

        ${summary.sections.map(section => `
          <div class="section">
            <h2 class="section-title">${section.title}</h2>
            ${section.items.map(item => `
              <div class="item">
                <h3 class="item-title">${item.title}</h3>
                <p class="item-summary">${item.summary}</p>
                <div class="item-meta">
                  Source: ${item.source_term} • 
                  <a href="${item.url}" target="_blank">Read more</a>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}

        <div class="footer">
          <p>This digest was automatically generated by <a href="https://digest.wtf">digest.wtf</a></p>
          <p>To update your preferences or unsubscribe, visit your dashboard.</p>
        </div>
      </body>
    </html>
  `;
}
