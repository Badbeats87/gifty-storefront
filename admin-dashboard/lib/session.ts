import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { getServiceSupabase } from './supabaseAdmin';

const supabase = getServiceSupabase();

const SESSION_COOKIE_NAME = 'gifty_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface Session {
  id: string;
  email: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

// Generate secure random token
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

// Create a new session
export async function createSession(email: string): Promise<Session> {
  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const { data, error } = await supabase
    .from('auth_sessions')
    .insert({
      email: email.toLowerCase(),
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return data;
}

// Get session from cookie
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const { data, error } = await supabase
    .from('auth_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if session is expired
  if (new Date(data.expires_at) < new Date()) {
    await deleteSession(sessionToken);
    return null;
  }

  // Update last activity
  await supabase
    .from('auth_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('session_token', sessionToken);

  return data;
}

// Set session cookie
export async function setSessionCookie(sessionToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

// Delete session
export async function deleteSession(sessionToken: string) {
  await supabase
    .from('auth_sessions')
    .delete()
    .eq('session_token', sessionToken);
}

// Clear session cookie
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Create magic link token
export async function createMagicLink(email: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const { error } = await supabase
    .from('magic_links')
    .insert({
      email: email.toLowerCase(),
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error(`Failed to create magic link: ${error.message}`);
  }

  return token;
}

// Verify magic link token
export async function verifyMagicLink(token: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('magic_links')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data || data.used) {
    return null;
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Mark as used
  await supabase
    .from('magic_links')
    .update({
      used: true,
      used_at: new Date().toISOString(),
    })
    .eq('token', token);

  return data.email;
}
