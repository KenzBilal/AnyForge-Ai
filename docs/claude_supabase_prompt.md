Here is the EXACT prompt you should copy and paste to Claude to build the entire AnyForge-AI database architecture in Supabase:

***

**PROMPT START**

Please connect to my Supabase database and execute the following complete DDL schema migration for "AnyForge-AI". 

This script must be executed in order. It will construct the `clients` table, `rate_limit_log` table, `extraction_logs` table, a `client_usage_summary` view, the required RPC functions for rate-limiting, and the Postgres Trigger that automatically creates an API key when a user signs up via Supabase Auth.

```sql
-- =========================================================================
-- ANYFORGE-AI COMPLETE SUPABASE SCHEMA MIGRATION
-- =========================================================================

-- Enable pgcrypto for generating secure API keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------
-- 1. IDENTITIES & CLIENT MANAGEMENT (clients table)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_min INT DEFAULT 20,
    daily_limit INT DEFAULT 500,
    inbound_email TEXT UNIQUE, -- Used for Email Webhook routing
    store_logs BOOLEAN DEFAULT true, -- Zero-Retention Enterprise Flag
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast API key lookups during authentication
CREATE INDEX IF NOT EXISTS idx_clients_api_key ON public.clients(api_key);

-- -------------------------------------------------------------------------
-- 2. RATE LIMITING ENGINE (rate_limit_log table & RPC)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    window_start TIMESTAMP WITH TIME ZONE,
    request_count INT DEFAULT 1,
    PRIMARY KEY (client_id, window_start)
);

-- RPC Function to securely increment the rate limit counter
CREATE OR REPLACE FUNCTION public.increment_rate_limit(p_client_id UUID, p_window_start TIMESTAMP WITH TIME ZONE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.rate_limit_log (client_id, window_start, request_count)
    VALUES (p_client_id, p_window_start, 1)
    ON CONFLICT (client_id, window_start) 
    DO UPDATE SET request_count = public.rate_limit_log.request_count + 1;
END;
$$;

-- -------------------------------------------------------------------------
-- 3. GLOBAL AUDIT TRAIL & TELEMETRY (extraction_logs table)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.extraction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    endpoint_used TEXT NOT NULL,
    target_schema TEXT NOT NULL,
    input_snippet TEXT,
    output_json JSONB,
    grounding_used BOOLEAN DEFAULT false,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast daily usage counts
CREATE INDEX IF NOT EXISTS idx_extraction_logs_client_time ON public.extraction_logs(client_id, created_at);

-- -------------------------------------------------------------------------
-- 4. ADMIN DASHBOARD VIEW (client_usage_summary)
-- -------------------------------------------------------------------------
-- Drops the old table if it accidentally exists as a base table from earlier iterations
DROP TABLE IF EXISTS public.client_usage_summary CASCADE;

-- Recreate as a live updating View
CREATE OR REPLACE VIEW public.client_usage_summary AS
SELECT 
    c.id,
    c.project_name,
    c.api_key,
    c.is_active,
    c.rate_limit_per_min,
    c.daily_limit,
    c.created_at,
    COUNT(el.id) AS total_extractions,
    COUNT(el.id) FILTER (WHERE el.created_at >= CURRENT_DATE) AS extractions_today,
    MAX(el.created_at) AS last_used_at
FROM 
    public.clients c
LEFT JOIN 
    public.extraction_logs el ON c.id = el.client_id
GROUP BY 
    c.id;

-- -------------------------------------------------------------------------
-- 5. ZERO-TOUCH AUTOMATED PROVISIONING (Auth Trigger)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  generated_key text;
BEGIN
  -- Generates a highly secure, random 32-character key starting with 'af-'
  generated_key := 'af-' || encode(gen_random_bytes(16), 'hex');

  -- Automatically creates their client profile and API key
  -- Defaulting to 20 req/min and 500 req/day for free tier
  INSERT INTO public.clients (user_id, project_name, api_key, rate_limit_per_min, daily_limit, is_active, store_logs)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My First Project'),
    generated_key,
    20,
    500,
    true,
    true
  );
  
  RETURN NEW;
END;
$$;

-- Drop trigger if modifying an existing setup, then attach it to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- END OF MIGRATION
-- =========================================================================
```

Please execute this complete script. Let me know if you encounter any errors so we can patch them!

**PROMPT END**
***
