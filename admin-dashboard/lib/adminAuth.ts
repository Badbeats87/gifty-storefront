import 'server-only';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { getServiceSupabase } from './supabaseAdmin';
import { verifyPassword } from './password';

const supabase = getServiceSupabase();

const ADMIN_SESSION_COOKIE_NAME = 'gifty_admin_session';
const ADMIN_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export interface AdminSession {
  id: string;
  admin_user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    email: string;
    full_name: string | null;
    role: string;
  };
}

// Generate secure random token
function generateAdminToken(): string {
  return randomBytes(32).toString('base64url');
}

// Create a new admin session
export async function createAdminSession(
  adminUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AdminSession> {
  const sessionToken = generateAdminToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION);

  const { data, error } = await supabase
    .from('admin_sessions')
    .insert({
      admin_user_id: adminUserId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create admin session: ${error.message}`);
  }

  return data;
}

// Get admin session from cookie
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const { data, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if session is expired
  if (new Date(data.expires_at) < new Date()) {
    await deleteAdminSession(sessionToken);
    return null;
  }

  return data as AdminSession;
}

// Set admin session cookie
export async function setAdminSessionCookie(sessionToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_DURATION / 1000,
    path: '/',
  });
}

// Delete admin session
export async function deleteAdminSession(sessionToken: string) {
  await supabase
    .from('admin_sessions')
    .delete()
    .eq('session_token', sessionToken);
}

// Clear admin session cookie
export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

// Require admin authentication (use in server components)
export async function requireAdminAuth(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  // Session exists and is valid - trust the session token
  return session;
}

// Verify admin credentials
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !user) {
    return { success: false, error: 'Invalid username or password' };
  }

  // Check if account is active
  if (!user.is_active) {
    return { success: false, error: 'Account is disabled' };
  }

  // Check if account is locked
  if (user.account_locked_until) {
    const lockedUntil = new Date(user.account_locked_until);
    if (lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (lockedUntil.getTime() - Date.now()) / 1000 / 60
      );
      return {
        success: false,
        error: `Account locked for ${minutesRemaining} more minute${minutesRemaining !== 1 ? 's' : ''}`,
      };
    }
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    // Increment failed attempts
    await supabase.rpc('increment_admin_failed_login_attempts', {
      admin_username: username.toLowerCase(),
    });

    return { success: false, error: 'Invalid username or password' };
  }

  // Reset failed attempts on successful login
  await supabase.rpc('reset_admin_failed_login_attempts', {
    admin_username: username.toLowerCase(),
  });

  return { success: true, userId: user.id };
}
