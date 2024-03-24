"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logOutServer() {
  const supabase = createServerSupabase(cookies());
  await supabase.auth.signOut();
  return redirect("/login");
}
