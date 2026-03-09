const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Using the Session Pooler port (6543) which uses IPv4 by default
const connectionString = 'postgresql://postgres.mnoletngbgtnfjutcbbs:Znek%407906@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase Postgres via Session Pooler IPv4!');
    
    // Check if user_id column actually exists
    const colRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='clients' AND column_name='user_id';
    `);
    console.log('\\n[TEST 1] user_id column exists?', colRes.rows.length > 0 ? 'YES' : 'NO');

    // Run the ultimate trigger fix directly!
    console.log('\\n[TEST 2] Applying gen_random_uuid trigger fix directly via script...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = ''
      AS $$
      DECLARE
        generated_key text;
      BEGIN
        generated_key := 'af-' || replace(gen_random_uuid()::text, '-', '');

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
    `);
    console.log('Trigger successfully overwritten with gen_random_uuid() variant!');
    
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}

run();
