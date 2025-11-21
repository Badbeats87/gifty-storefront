import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kppdvozuesiycwdacqgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcGR2b3p1ZXNpeWN3ZGFjcWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjQ5NTYsImV4cCI6MjA3OTAwMDk1Nn0.Gsc4qx8RK82k6pz0zoZWimXkRsN90Zz3OjvTwpZbO5c';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('Testing product fetch with anon key...\n');
  
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', '96611f14-e945-4e06-a3a9-fb8108e15c0a')
    .eq('is_visible', true)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data) {
    console.log('❌ No product found');
    return;
  }

  console.log('✅ Product found:');
  console.log(JSON.stringify(data, null, 2));
}

test();
