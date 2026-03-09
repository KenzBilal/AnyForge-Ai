-- AnyForge-AI Self-Serve Automation
-- Run this directly in your Supabase SQL Editor

-- 1. Add a user_id column to link the API key to the specific person who signed up
alter table public.clients 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Create the secure API key generator function
create extension if not exists pgcrypto;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  generated_key text;
begin
  -- Generates a highly secure, random 32-character key starting with 'af-'
  generated_key := 'af-' || encode(gen_random_bytes(16), 'hex');

  -- Automatically creates their client profile and API key
  -- Defaulting to 20 req/min and 500 req/day for free tier
  insert into public.clients (user_id, project_name, api_key, rate_limit_per_min, daily_limit, is_active)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'My First Project'),
    generated_key,
    20,
    500,
    true
  );
  
  return new;
end;
$$;

-- 3. Attach the trigger to fire instantly when someone signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
