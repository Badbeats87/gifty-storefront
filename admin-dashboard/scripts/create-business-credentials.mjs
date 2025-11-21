import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

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

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function createBusinessCredentials() {
  try {
    // Get all businesses with contact_email
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, contact_email')
      .not('contact_email', 'is', null);

    if (fetchError) {
      console.error('Error fetching businesses:', fetchError);
      process.exit(1);
    }

    console.log(`Found ${businesses.length} businesses\n`);

    const createdCredentials = [];
    const skippedCredentials = [];

    for (const business of businesses) {
      // Check if credentials already exist
      const { data: existingCreds } = await supabase
        .from('business_credentials')
        .select('*')
        .eq('email', business.contact_email)
        .maybeSingle();

      if (existingCreds) {
        skippedCredentials.push(business.contact_email);
        continue;
      }

      // Generate temporary password
      const tempPassword = randomBytes(12).toString('hex');
      const passwordHash = await hashPassword(tempPassword);

      // Create credentials
      const { error: credError } = await supabase
        .from('business_credentials')
        .insert({
          email: business.contact_email,
          password_hash: passwordHash,
          failed_login_attempts: 0,
        });

      if (credError) {
        console.error(`❌ Error creating credentials for ${business.contact_email}:`, credError);
        continue;
      }

      createdCredentials.push({
        business: business.name,
        email: business.contact_email,
        tempPassword: tempPassword,
      });
    }

    // Display results
    console.log('✅ Credentials Created:\n');
    if (createdCredentials.length === 0) {
      console.log('  (none - all businesses already have credentials)\n');
    } else {
      createdCredentials.forEach((cred) => {
        console.log(`  Business: ${cred.business}`);
        console.log(`  Email: ${cred.email}`);
        console.log(`  Temp Password: ${cred.tempPassword}\n`);
      });
    }

    if (skippedCredentials.length > 0) {
      console.log('⏭️  Skipped (already have credentials):\n');
      skippedCredentials.forEach((email) => {
        console.log(`  ${email}`);
      });
      console.log('');
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Total businesses: ${businesses.length}`);
    console.log(`  Created: ${createdCredentials.length}`);
    console.log(`  Skipped: ${skippedCredentials.length}`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createBusinessCredentials();
