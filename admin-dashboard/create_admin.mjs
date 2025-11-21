import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAdmin() {
  try {
    const password = 'Gifty@Admin2024$Prod';
    const passwordHash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: 'admin',
        email: 'alexis.b.f.braine@gmail.com',
        password_hash: passwordHash,
        full_name: 'Site Owner',
        role: 'super_admin',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.error('❌ Error: Username or email already exists');
      } else {
        console.error('❌ Error:', error.message);
      }
      process.exit(1);
    }

    console.log('\n✅ Admin user created successfully!\n');
    console.log('Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Username: ${data.username}`);
    console.log(`Email: ${data.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${data.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createAdmin();
