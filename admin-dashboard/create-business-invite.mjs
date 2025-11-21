import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
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

async function createBusinessInvite() {
  try {
    // Generate a unique token
    const inviteToken = randomBytes(32).toString('hex');
    const businessEmail = 'business@example.com';

    // Create invitation that expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from('business_invites')
      .insert({
        email: businessEmail,
        invite_token: inviteToken,
        invited_by: 'admin',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        message: 'You are invited to join Gifty as a business partner!',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invite:', error);
      process.exit(1);
    }

    console.log('✅ Business invitation created successfully!\n');
    console.log('📋 Invitation Details:');
    console.log(`   Email: ${businessEmail}`);
    console.log(`   Token: ${inviteToken}`);
    console.log(`   Expires: ${expiresAt.toISOString()}\n`);
    console.log('🔗 Registration URL:');
    console.log(`   http://localhost:3001/register/${inviteToken}\n`);
    console.log('💡 Tip: Copy the registration URL and open it in a browser to test the business registration flow.\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createBusinessInvite();
