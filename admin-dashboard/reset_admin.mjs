import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function resetAdmin() {
  try {
    // Delete existing admin
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('username', 'admin');

    if (deleteError) {
      console.error('❌ Delete error:', deleteError.message);
      process.exit(1);
    }

    // Create new admin with known password
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
      console.error('❌ Create error:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Admin Credentials Reset Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMIN LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Username: admin`);
    console.log(`Email: alexis.b.f.braine@gmail.com`);
    console.log(`Password: Gifty@Admin2024$Prod`);
    console.log(`Role: super_admin`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

resetAdmin();
