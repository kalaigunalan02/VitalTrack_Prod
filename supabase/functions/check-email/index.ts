// Supabase Edge Function: check-email
//
// Returns whether an account exists for a given email. This MUST run server-side
// because the browser anon key cannot read auth.users. The service role key is
// used here (never exposed to the client) to look up auth.users by email.
//
// Deploy to BOTH Supabase projects:
//   supabase functions deploy check-email --no-verify-jwt
// (or via the Dashboard → Edge Functions → New function → paste this file)
//
// Then set the function secret (in Dashboard → Edge Functions → Secrets):
//   SUPABASE_SERVICE_ROLE_KEY = <your project's service_role key>
// (This is already available as a built-in in Supabase Edge Functions, so you
//  typically don't need to set it manually — Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
//  resolves to the project's own service role key.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create an admin client using the service role key (server-side only).
    // The URL + service key are injected by the Supabase runtime.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // List users matching the email. auth.admin.listUsers is the admin API.
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })

    // listUsers doesn't filter by email, so we search the returned users.
    // For a more targeted lookup, we query via the admin getUserByEmail-like
    // approach: iterate is inefficient at scale, but for the common case
    // (checking one email) we use the REST endpoint directly.
    //
    // Simpler + reliable: use the admin API to get user by email.
    const { data: user, error: lookupError } =
      await supabaseAdmin.auth.admin.getUserByEmail(email)

    const exists = !lookupError && !!user?.user

    return new Response(JSON.stringify({ exists }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
