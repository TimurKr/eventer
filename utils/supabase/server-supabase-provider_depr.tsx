import "server-only";

import { createServerClient } from "@supabase/ssr";
import { headers, cookies } from "next/headers";
import { Database } from "@/utils/supabase/database.types";

// do not cache this page
export const revalidate = 0;

const cookieStore = cookies();

export function useServerSupabase() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );
}

export async function useServerAuthentificated() {
  const supabase = useServerSupabase();
  const { data: user } = await supabase.auth.getUser();
  return !!user;
}

export async function useServerUser() {
  const supabase = useServerSupabase();
  const {
    data: { user: BaseUser },
  } = await supabase.auth.getUser();

  if (!BaseUser) return null;

  const { data: ExtensionUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", BaseUser.id)
    .single();

  const user = {
    ...BaseUser,
    ...ExtensionUser,
  };

  return user;
}
