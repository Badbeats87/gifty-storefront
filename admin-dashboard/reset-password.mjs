import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Hash the new password
const newPassword = 'Admin@123';
const hashedPassword = await hash(newPassword, 10);

// Update the admin user
const { data, error } = await supabase
  .from('admin_users')
  .update({ password_hash: hashedPassword })
  .eq('username', 'admin')
  .select();

if (error) {
  console.error('Error:', error);
} else {
  console.log('✅ Password reset successfully!');
  console.log('Username: admin');
  console.log('Password: Admin@123');
}
