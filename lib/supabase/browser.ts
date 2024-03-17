import type { Database } from "@/lib/supabase/database.types";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const createBrowserSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
};

export function useBrowserUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const supabase = createBrowserSupabase()
      .auth.getUser()
      .then((user) => {
        setUser(user?.data?.user || null);
      });
  }, []);
  return user;
}
