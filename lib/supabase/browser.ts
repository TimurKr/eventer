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

type UserHookState =
  | { user: User; isFetching: false }
  | { user: null; isFetching: boolean };

export function useBrowserUser(): UserHookState {
  const [state, setState] = useState<UserHookState>({
    user: null,
    isFetching: true,
  });
  useEffect(() => {
    const supabase = createBrowserSupabase()
      .auth.getUser()
      .then((user) => {
        setState({ user: user?.data?.user || null, isFetching: false });
      });
  }, []);
  return state;
}
