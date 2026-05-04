// @ts-nocheck - This is a Deno edge function, not regular TypeScript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing hCaptcha token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get hCaptcha secret from environment variables
    const hCaptchaSecret = Deno.env.get('HCAPTCHA_SECRET_KEY');
    const hCaptchaSiteKey = Deno.env.get('HCAPTCHA_SITE_KEY');

    if (!hCaptchaSecret || !hCaptchaSiteKey) {
      return new Response(
        JSON.stringify({ error: 'hCaptcha not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify token with hCaptcha API
    const verifyResponse = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${hCaptchaSecret}&response=${token}`,
    });

    const result = await verifyResponse.json();

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid hCaptcha token',
          errorCodes: result['error-codes'],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return success and site key to frontend
    return new Response(
      JSON.stringify({
        success: true,
        siteKey: hCaptchaSiteKey,
        verified: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
