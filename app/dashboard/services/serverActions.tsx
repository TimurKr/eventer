"use server";

import { InsertServices, Services } from "@/utils/supabase/database.types";
import { createServerSupabase } from "@/utils/supabase/server";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export async function fetchServices() {
  const supabase = createServerSupabase(cookies(), ["services"]);
  return await supabase.from("services").select("*").order("name");
}

export async function insertServices(service: InsertServices[]) {
  const supabase = createServerSupabase(cookies());
  const r = await supabase.from("services").insert(service).select("*");
  if (!r.error) {
    revalidateTag("services");
  }
  return r;
}

export async function updateService(
  service: Partial<Services> & { id: Services["id"] },
) {
  const supabase = createServerSupabase(cookies());
  const r = await supabase
    .from("services")
    .update(service)
    .eq("id", service.id)
    .select("*");
  if (!r.error) {
    revalidateTag("services");
  }
  return r;
}

export async function deleteService(id: Services["id"]) {
  const supabase = createServerSupabase(cookies());
  const r = await supabase.from("services").delete().eq("id", id);
  if (!r.error) {
    revalidateTag("services");
  }
  return r;
}
