// lib/supabase-server.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const createSupabaseServerClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!supabaseKey) {
    console.error("Error: SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(supabaseUrl!, supabaseKey!);
};

export const supabaseServer = createSupabaseServerClient();
