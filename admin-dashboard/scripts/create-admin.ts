/**
 * Script to create an admin user
 * Usage: npx tsx scripts/create-admin.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAdminUser() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log('\n🔐 Create Admin User\n');
    console.log('This script will create a new admin user for the GiftyV2 platform.\n');

    // Get username
    const username = await rl.question('Username: ');
    if (!username || username.length < 3) {
      console.error('❌ Username must be at least 3 characters');
      process.exit(1);
    }

    // Get email
    const email = await rl.question('Email: ');
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    // Get full name
    const fullName = await rl.question('Full Name (optional): ');

    // Get password
    const password = await rl.question('Password (min 12 chars): ');
    if (!password || password.length < 12) {
      console.error('❌ Password must be at least 12 characters');
      process.exit(1);
    }

    const confirmPassword = await rl.question('Confirm Password: ');
    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      process.exit(1);
    }

    // Get role
    const roleInput = await rl.question('Role (admin/super_admin) [admin]: ');
    const role = roleInput.trim() || 'admin';
    if (role !== 'admin' && role !== 'super_admin') {
      console.error('❌ Role must be either "admin" or "super_admin"');
      process.exit(1);
    }

    console.log('\n⏳ Creating admin user...\n');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName || null,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        console.error('❌ Error: Username or email already exists');
      } else {
        console.error('❌ Error creating admin user:', error.message);
      }
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!\n');
    console.log('Details:');
    console.log(`  Username: ${data.username}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Role: ${data.role}`);
    console.log(`  ID: ${data.id}\n`);
    console.log('You can now login at: http://localhost:3000/admin/login\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdminUser();
