"use server";

import { createServerSupabase } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = createServerSupabase(cookies());
  await supabase.auth.signOut();
  return redirect("/login");
}

export async function fetchServices() {
  const supabase = createServerSupabase(cookies());
  return await supabase.from("services").select("*").order("name");
}
