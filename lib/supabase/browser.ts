import type { Database } from "@/lib/supabase/database.types";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

type UserHookState =
  | { user: User | null; isFetching: false }
  | { user: undefined; isFetching: true };

/**
 *
 * @returns Object with 2 properties: `user` and `isFetching`
 */
export function useUser(): UserHookState {
  const [state, setState] = useState<UserHookState>({
    user: undefined,
    isFetching: true,
  });
  useEffect(() => {
    createBrowserSupabase()
      .auth.getUser()
      .then((user) => {
        setState({ user: user?.data?.user, isFetching: false });
      });
  }, []);
  return state;
}
