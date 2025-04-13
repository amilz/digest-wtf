# digest.wtf
> Daily digests powered by AI - Stay informed without the noise

![Vercel Next.js Hackathon Project](https://img.shields.io/badge/Vercel_Next.js-Hackathon-black)

## Overview

digest.wtf is a personalized web content aggregation service that helps users stay informed without the information overload. Users can create customized digests from various sources across the web, which are processed using AI and delivered straight to their inbox.

## Features

- **Customizable Digests**: Create personalized content digests with various sources:
  - Search terms across the web
  - X (Twitter) handles and hashtags 
  - Specific websites
- **AI-Powered Summaries**: Uses multiple AI models (Claude, OpenAI, Grok) to generate concise, relevant summaries
- **Scheduled Delivery**: Configure digests to run hourly, daily, or weekly
- **Email Delivery**: Receive neatly formatted digests directly in your inbox
- **User Dashboard**: Manage your digests and view past results

## Tech Stack

### Frontend
Built using [v0](https://v0.dev/)
- **Framework**: [Next.js](https://nextjs.org/) 15+
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)

### Backend
- **Serverless Functions**: [Vercel Functions](https://vercel.com/docs/functions)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Database**: [Supabase PostgreSQL](https://supabase.com/database)
- **Scheduled Jobs**: [Vercel Cron](https://vercel.com/docs/cron-jobs)
- **Email Delivery**: [Resend](https://resend.com/)

### AI Integration
- **AI Models**: Integrated through [Vercel AI SDK](https://sdk.vercel.ai/docs)
  - [Anthropic Claude](https://www.anthropic.com/claude)
  - [OpenAI](https://openai.com/)
  - [Xai (Grok)](https://x.ai/)

## Architecture

1. **User Flow**:
   - User logs in with Google OAuth
   - Users create digest configurations with sources (search terms, X handles, websites)
   - User can create up to 2 digests for free
   - (disabled) Users can test digests from Dashboard
   - Cron jobs trigger digest processing on schedule
   - AI models aggregate and summarize content from sources
   - Generated digests are sent to users via email

2. **Data Flow**:
   - Digest configurations stored in Supabase
   - Cron job triggers processing API endpoint

## Local Development

### Prerequisites
- Node.js 20+
- pnpm
- Supabase account
- API keys for OpenAI, Anthropic, and Xai

### Setup
1. Clone the repository
```bash
git clone https://github.com/amilz/digest-wtf.git
cd digest-wtf
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Fill in the required API keys and configuration
```

4. Run the development server
```bash
pnpm dev
```

## Deployment

This project is designed to be deployed on Vercel with the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `OPENAI_API_KEY`: OpenAI API key
- `XAI_API_KEY`: Xai (Grok) API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `RESEND_API_KEY`: Resend API key for sending emails
- `CRON_SECRET`: Secret for securing cron job endpoints
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `ACCESS_CODE`: Optional access code for invite-only signup
- `MAX_DIGESTS`: Maximum number of digests per user (default: 2)

## Project Status

This project is a submission for the Vercel Next.js Hackathon and is currently in MVP stage. Future enhancements could include:
- Additional source types (Reddit, HackerNews, RSS feeds)
- Advanced filtering options
- Custom delivery schedules
- Digest templates

### Known Limitations
- **AI Models:** Current AI Models have limited access to latest data. Additional AI query testing required and/or integration with Web2 APIs (e.g., X.com, Brave, etc.).
- **Cron Schedule:** Vercel free limited to daily cron jobs. Need to create more robust queueing or scheduling as project scales