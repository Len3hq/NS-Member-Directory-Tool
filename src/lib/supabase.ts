import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseReadonly: SupabaseClient | null = null;

// Public client — used on the frontend, respects RLS
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      getEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    );
  }
  return _supabase;
}

// Service client — used in API routes only, bypasses RLS
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      getEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _supabaseAdmin;
}

// Read-only client for the ElizaOS agent (anon key, SELECT only via RLS)
export function getSupabaseReadonly(): SupabaseClient {
  if (!_supabaseReadonly) {
    _supabaseReadonly = createClient(
      getEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    );
  }
  return _supabaseReadonly;
}

// Convenience aliases (lazy, called only at request time in API routes)
export const supabaseAdmin = { get: getSupabaseAdmin };
export const supabaseReadonly = { get: getSupabaseReadonly };
