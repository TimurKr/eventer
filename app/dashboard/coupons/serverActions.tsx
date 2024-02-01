"use server";

import { InsertCoupons } from "@/utils/supabase/database.types";
import { createServerSupabase } from "@/utils/supabase/server";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export async function fetchCoupons() {
  const r = await createServerSupabase(cookies(), ["coupons"])
    .from("coupons")
    .select("*");

  return r;
}

export type Coupons = NonNullable<
  Awaited<ReturnType<typeof fetchCoupons>>["data"]
>[0];

// Insert a new coupon
export async function insertCoupons(coupons: InsertCoupons[]) {
  const r = await createServerSupabase(cookies())
    .from("coupons")
    .insert(coupons)
    .select();

  if (!r.error) revalidateTag("coupons");

  return r;
}
