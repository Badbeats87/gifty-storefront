import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  try {
    // Check if admin already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (existing) {
      console.log('✅ Admin user already exists!');
      console.log('📝 Credentials:');
      console.log('   Username: admin');
      console.log('   Password: Admin@123');
      return;
    }

    // Create admin user
    const hashedPassword = await hash('Admin@123', 10);
    
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: 'admin',
        email: 'admin@gifty.local',
        password_hash: hashedPassword,
        full_name: 'Administrator',
        is_active: true,
        role: 'super_admin',
      })
      .select();

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📝 Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createAdmin();
