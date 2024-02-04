"use server";

import { InsertCoupons } from "@/utils/supabase/database.types";
import { createServerSupabase } from "@/utils/supabase/server";
import moment from "moment";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { validateCoupon } from "./utils";

export async function fetchCoupons() {
  const r = await createServerSupabase(cookies(), ["coupons"])
    .from("coupons")
    .select(
      `*,
      created_from:tickets!tickets_coupon_created_id_fkey(
        id,
        guest:contacts!tickets_guest_id_fkey(*),
        billing:contacts!tickets_billing_id_fkey(*)
      ),
      redeemed_from:tickets!tickets_coupon_redeemed_id_fkey(
        id,
        guest:contacts!tickets_guest_id_fkey(*),
        billing:contacts!tickets_billing_id_fkey(*)
      )`,
    )
    .order("created_at", { ascending: false });
  if (r.error) return r;
  return {
    ...r,
    data: r.data.map((c) => ({ ...c, valid: validateCoupon(c) })),
  };
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

// Update a coupon
export async function updateCoupon(
  coupon: Partial<Coupons> & NonNullable<{ id: Coupons["id"] }>,
) {
  const r = await createServerSupabase(cookies())
    .from("coupons")
    .update(coupon)
    .eq("id", coupon.id)
    .select();

  if (!r.error) revalidateTag("coupons");

  return r;
}

// Delete a coupon
export async function deleteCoupon(coupon: { id: Coupons["id"] }) {
  const r = await createServerSupabase(cookies())
    .from("coupons")
    .delete()
    .eq("id", coupon.id)
    .select();

  if (!r.error) revalidateTag("coupons");

  return r;
}
