import "server-only";

import { Database } from "@/lib/supabase/database.types";
import { createServerClient } from "@supabase/ssr";

/**
 * This instance overrides RLS, use with caution. It still adheres to the RLS of the signed in user.
 */
export function createAdminSupabase() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
      },
    },
  );
}
