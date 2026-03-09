-- AnyForge-AI Enterprise v3 Database Migration
-- Run this directly in your Supabase SQL Editor

-- 1. Add Zero-Retention flag to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS store_logs BOOLEAN DEFAULT true;

-- 2. Optional: If you want to drop the old rate limit RPC function
-- since we moved to Upstash Redis, you can run this (safe to ignore if you want to keep Postgres as a fallback)
-- DROP FUNCTION IF EXISTS public.increment_rate_limit(uuid, timestamp with time zone);

-- 3. Update existing clients to ensure they have store_logs set to true
UPDATE public.clients SET store_logs = true WHERE store_logs IS NULL;

-- 4. Create missing tables if they don't exist (just to be safe)
CREATE TABLE IF NOT EXISTS public.client_usage_summary (
    id UUID PRIMARY KEY,
    project_name TEXT,
    api_key TEXT,
    is_active BOOLEAN,
    rate_limit_per_min INT,
    daily_limit INT,
    created_at TIMESTAMP WITH TIME ZONE,
    total_extractions BIGINT,
    extractions_today BIGINT,
    last_used_at TIMESTAMP WITH TIME ZONE
);
