// @ts-nocheck - Deno Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const MAX_EMAILS_PER_DAY = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSupabasePublicKey() {
  const legacyAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacyAnonKey) return legacyAnonKey;

  const publishableKeys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (!publishableKeys) return null;

  try {
    const parsed = JSON.parse(publishableKeys);
    const values = collectStringValues(parsed);
    return (
      values.find((value) => value.startsWith('sb_publishable_')) ||
      values[0] ||
      null
    );
  } catch {
    return publishableKeys;
  }
}

function collectStringValues(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStringValues);
  }
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabasePublicKey = getSupabasePublicKey();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail =
      Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@foundertype.app';
    const fromName = Deno.env.get('RESEND_FROM_NAME') || 'FounderType';

    if (!supabaseUrl || !supabasePublicKey || !resendApiKey) {
      return json({ error: 'Email service not configured' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(supabaseUrl, supabasePublicKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: 'Authentication required' }, 401);
    }

    const { to, subject, html, text } = await req.json();

    if (!to || !EMAIL_PATTERN.test(to) || to.length > 254) {
      return json({ error: 'Invalid recipient email' }, 400);
    }

    if (!subject || subject.length > 140) {
      return json({ error: 'Invalid subject' }, 400);
    }

    if ((!html && !text) || String(html || text).length > 12000) {
      return json({ error: 'Invalid email body' }, 400);
    }

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await userClient
      .from('email_send_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString());

    if (countError) {
      return json({ error: 'Unable to verify email limit' }, 500);
    }

    if ((count || 0) >= MAX_EMAILS_PER_DAY) {
      return json({ error: 'Daily email limit reached' }, 429);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Resend send failed:', errorBody);
      return json({ error: 'Email provider rejected the request' }, 502);
    }

    const { error: logError } = await userClient.from('email_send_log').insert({
      user_id: user.id,
      recipient: to,
      subject,
    });

    if (logError) {
      console.error('Email log insert failed:', logError.message);
    }

    return json({ success: true });
  } catch (error) {
    return json({ error: error?.message || 'Internal server error' }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
