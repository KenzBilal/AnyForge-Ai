const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log('Testing getting clients table directly:');
  
  const { data, error } = await supabase.from('clients').select('*').limit(1);

  if (error) {
    console.error('Fetch Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Fetch Success, clients table exists:', data);
  }
}

testSignup();
