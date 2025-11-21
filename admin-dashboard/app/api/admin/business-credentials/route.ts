import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    await requireAdminAuth();

    const { email, businessId, action } = await request.json();

    if (!email || !action) {
      return NextResponse.json({ error: 'Email and action are required' }, { status: 400 });
    }

    if (action !== 'reset_password') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Generate temporary password
    const tempPassword = randomBytes(12).toString('hex');
    const passwordHash = await hashPassword(tempPassword);

    // Check if credentials exist
    const { data: existingCreds } = await supabase
      .from('business_credentials')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingCreds) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('business_credentials')
        .update({
          password_hash: passwordHash,
          failed_login_attempts: 0,
          account_locked_until: null,
        })
        .eq('email', email);

      if (updateError) {
        console.error('Error updating credentials:', updateError.message);
        return NextResponse.json({ error: `Failed to update credentials: ${updateError.message}` }, { status: 500 });
      }
    } else {
      // Create new credentials
      const { error: createError } = await supabase
        .from('business_credentials')
        .insert({
          email,
          password_hash: passwordHash,
          failed_login_attempts: 0,
        });

      if (createError) {
        console.error('Error creating credentials:', createError.message);
        return NextResponse.json({ error: `Failed to create credentials: ${createError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Password reset successfully',
      email,
      tempPassword,
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (POST /api/admin/business-credentials):', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
