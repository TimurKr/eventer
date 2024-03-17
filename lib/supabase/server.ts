import "server-only";

import { Database } from "@/lib/supabase/database.types";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Do not cache
export const revalidate = 0;

export const createServerSupabase = (
  cookieStore: ReturnType<typeof cookies>,
  tags?: string[],
) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          return fetch(input, {
            ...init,
            next: { tags: tags },
          });
        },
      },
    },
  );
};

export const getServerUser = async (
  cookieStore: ReturnType<typeof cookies>,
) => {
  const supabase = createServerSupabase(cookieStore, ["user"]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  const { data: profile, error: profileError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", user?.id)
    .single();

  if (profileError) {
    throw profileError;
  }
  return { ...user, ...profile };
};
