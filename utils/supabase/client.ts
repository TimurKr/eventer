import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/utils/supabase/database.types";

export const createBrowserSupabase = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

export const getBrowserUser = async () => {
  const supabase = createBrowserSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}