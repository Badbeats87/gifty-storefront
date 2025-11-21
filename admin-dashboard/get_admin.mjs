import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getAdmin() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, email, role, is_active')
    .eq('username', 'admin')
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Existing Admin User Found:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Username: ${data.username}`);
  console.log(`Email: ${data.email}`);
  console.log(`Role: ${data.role}`);
  console.log(`Active: ${data.is_active}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Note: Password from initial setup should be used to login.\n');
}

getAdmin();
