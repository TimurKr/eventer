import { Coupons } from "@/utils/supabase/database.types";
import moment from "moment";

export function validateCoupon(coupon: Coupons): boolean {
  if (coupon.amount <= 0) return false;
  if (coupon.valid_until === null) return true;
  return moment(coupon.valid_until).endOf("day") >= moment();
}
