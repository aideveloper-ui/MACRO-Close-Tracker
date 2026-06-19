import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client. These env vars are NOT prefixed with
// NEXT_PUBLIC_, so they never reach the browser. All DB access goes
// through our own API routes — the client never talks to Supabase directly.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment (.env.local)."
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
