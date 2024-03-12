import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import Fuse from "fuse.js";
import moment from "moment";

export function validateCoupon(coupon: CouponsDocument): boolean {
  if (coupon.amount <= 0) return false;
  if (coupon.valid_until === null) return true;
  return moment(coupon.valid_until).endOf("day") >= moment();
}

export function searchCoupons(
  term: string,
  {
    coupons,
    contacts,
  }: {
    coupons: CouponsDocument[];
    contacts: ContactsDocument[];
  },
) {
  if (term === "") {
    return [];
  }

  // Prepare data
  let data = coupons.map((coupon) => ({
    coupon,
    contact: contacts.find((contact) => contact.id === coupon.contact_id),
  }));

  const fuse = new Fuse(data, {
    keys: [
      "coupon.code",
      "coupon.note",
      "coupon.amount",
      "coupon.original_amount",
      "contact.name",
      "contact.email",
      "contact.phone",
    ].flat(),
    shouldSort: true,
  });

  return fuse.search(term).map((r) => r.item);
}
