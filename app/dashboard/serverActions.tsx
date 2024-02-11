"use server";

import { createServerSupabase } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function fetchServices() {
  const supabase = createServerSupabase(cookies());
  return await supabase.from("services").select("*").order("name");
}