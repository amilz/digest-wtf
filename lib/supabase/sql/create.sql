-- Create digests table
CREATE TABLE public.digests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'hourly')),
    active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create digest_sources table
CREATE TABLE public.digest_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    digest_id UUID NOT NULL REFERENCES public.digests(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('search_term', 'x_handle', 'x_hashtag', 'website')),
    source_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create digest_runs table
CREATE TABLE public.digest_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    digest_id UUID NOT NULL REFERENCES public.digests(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    run_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for digests table
CREATE POLICY "Users can view their own digests" 
    ON public.digests FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own digests" 
    ON public.digests FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digests" 
    ON public.digests FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own digests" 
    ON public.digests FOR DELETE 
    USING (auth.uid() = user_id);

-- Create policies for digest_sources table
CREATE POLICY "Users can view sources for their digests" 
    ON public.digest_sources FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.digests 
        WHERE digests.id = digest_sources.digest_id 
        AND digests.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert sources for their digests" 
    ON public.digest_sources FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.digests 
        WHERE digests.id = digest_sources.digest_id 
        AND digests.user_id = auth.uid()
    ));

CREATE POLICY "Users can update sources for their digests" 
    ON public.digest_sources FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.digests 
        WHERE digests.id = digest_sources.digest_id 
        AND digests.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete sources for their digests" 
    ON public.digest_sources FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.digests 
        WHERE digests.id = digest_sources.digest_id 
        AND digests.user_id = auth.uid()
    ));

-- Create policies for digest_runs table
CREATE POLICY "Users can view runs for their digests" 
    ON public.digest_runs FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.digests 
        WHERE digests.id = digest_runs.digest_id 
        AND digests.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert runs for their digests" 
    ON public.digest_runs FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.digests 
        WHERE digests.id = digest_runs.digest_id 
        AND digests.user_id = auth.uid()
    ));

CREATE POLICY "Users can update runs for their digests" 
    ON public.digest_runs FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.digests 
        WHERE digests.id = digest_runs.digest_id 
        AND digests.user_id = auth.uid()
    ));