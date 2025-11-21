import 'server-only';
import { redirect } from 'next/navigation';
import { getSession, type Session } from './session';
import { getServiceSupabase } from './supabaseAdmin';

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect('/owner/login');
  }
  return session;
}

export async function getBusinessForUser(email: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .ilike('contact_email', email)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getBusinessByIdForUser(businessId: string, email: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .maybeSingle();

  if (
    error ||
    !data ||
    !data.contact_email ||
    data.contact_email.toLowerCase() !== email.toLowerCase()
  ) {
    return null;
  }

  return data;
}
