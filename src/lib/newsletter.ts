import { supabase } from '@/lib/supabase';
import { NewsletterSubscriber } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export type SubscribeResult =
  | { ok: true; message: string }
  | { ok: false; error: string; code: 'duplicate' | 'invalid' | 'network' | 'unknown' };

/**
 * Subscribe an email to the newsletter. Calls the `welcome-email` edge function
 * which inserts the row (deduped by unique email), generates tokens, and sends
 * the double-opt-in verification email via Resend.
 */
export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  const clean = email.trim().toLowerCase();
  if (!isValidEmail(clean)) {
    return { ok: false, error: 'Please enter a valid email address.', code: 'invalid' };
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/welcome-email`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'subscribe', email: clean }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data?.code === 'duplicate') {
        return { ok: false, error: data?.error || 'You are already subscribed.', code: 'duplicate' };
      }
      if (data?.code === 'rate_limited') {
        return { ok: false, error: 'Too many attempts. Please try again later.', code: 'network' };
      }
      return { ok: false, error: data?.error || 'Something went wrong. Please try again.', code: 'unknown' };
    }

    return { ok: true, message: data?.message || 'Check your inbox to confirm your subscription.' };
  } catch (err) {
    return {
      ok: false,
      error: 'Network error. Please check your connection and try again.',
      code: 'network',
    };
  }
}

/** Look up a subscriber by verification token (used by the verify page). */
export async function lookupByToken(token: string, kind: 'verify' | 'unsubscribe') {
  const { data, error } = await supabase
    .rpc('lookup_subscriber_by_token', { p_token: token, p_kind: kind });
  if (error) return null;
  return (data as { id: string; email: string; verified: boolean }[])?.[0] ?? null;
}

/** Confirm a subscription via the edge function (flips verified = true). */
export async function confirmSubscription(token: string): Promise<{ ok: boolean; message: string }> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/welcome-email`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'verify', token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.error || 'Verification failed.' };
    return { ok: true, message: data?.message || 'Your subscription is confirmed.' };
  } catch {
    return { ok: false, message: 'Network error. Please try again.' };
  }
}

/** Unsubscribe via the edge function (flips verified = false). */
export async function unsubscribe(token: string): Promise<{ ok: boolean; message: string }> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/welcome-email`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'unsubscribe', token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.error || 'Unsubscribe failed.' };
    return { ok: true, message: data?.message || 'You have been unsubscribed.' };
  } catch {
    return { ok: false, message: 'Network error. Please try again.' };
  }
}

/* ----------------------------- Admin helpers ----------------------------- */

export async function getAllSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as NewsletterSubscriber[]) ?? [];
}

export async function getVerifiedSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('verified', true)
    .order('created_at', { ascending: false });
  return (data as NewsletterSubscriber[]) ?? [];
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  return !error;
}

export async function countSubscribers(onlyVerified = false): Promise<number> {
  let q = supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true });
  if (onlyVerified) q = q.eq('verified', true);
  const { count } = await q;
  return count ?? 0;
}

export async function searchSubscribers(term: string): Promise<NewsletterSubscriber[]> {
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .ilike('email', `%${term}%`)
    .order('created_at', { ascending: false });
  return (data as NewsletterSubscriber[]) ?? [];
}
