import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

let client: SupabaseClient<Database> | null = null;

export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);

export function getSupabaseClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !publishableKey) {
    return null;
  }

  client ??= createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return client;
}

