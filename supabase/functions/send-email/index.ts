import { createClient } from 'npm:@supabase/supabase-js@2.105.1';
import { createEmailHandler } from './handler.ts';
const env = (name: string) => Deno.env.get(name);
Deno.serve(async (req: Request) => {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_ANON_KEY');
  const secret = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key || !secret)
    return new Response('Service unavailable', { status: 503 });
  const service = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const handler = createEmailHandler({
    env,
    fetcher: fetch,
    user: async (authorization) => {
      const client = createClient(url, key, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false },
      });
      const { data, error } = await client.auth.getUser();
      return error ? null : data.user?.id || null;
    },
    receipt: async (id, userId) => {
      const { data, error } = await service
        .from('accountability_receipts')
        .select('commitment_id')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error('Receipt lookup failed');
      return data;
    },
    commitment: async (id, userId) => {
      const { data, error } = await service
        .from('commitments')
        .select('commitment_text, daily_action, days_completed, status')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error('Commitment lookup failed');
      return data;
    },
    reserve: async (userId, receiptId, recipient) => {
      const { data, error } = await service.rpc('reserve_receipt_email', {
        target_user: userId,
        target_receipt: receiptId,
        target_recipient: recipient,
      });
      if (error) return null;
      return data;
    },
    mark: async (id, status) => {
      const { error } = await service
        .from('email_send_log')
        .update({ status })
        .eq('id', id);
      if (error) throw new Error('Log update failed');
    },
  });
  return handler(req);
});
