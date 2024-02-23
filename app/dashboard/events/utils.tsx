import {
  Contacts,
  TicketTypes,
  Tickets,
} from "@/utils/supabase/database.types";

type TicketWitchContacts = Tickets & {
  // billing: Contacts | null;
  // guest: Contacts | null;
  type: TicketTypes;
};

export function contactsEqual(
  a: Pick<Contacts, "name" | "email" | "phone" | "address">,
  b: Pick<Contacts, "name" | "email" | "phone" | "address">,
) {
  return (
    a.name == b.name &&
    a.email == b.email &&
    a.phone == b.phone &&
    a.address == b.address
  );
}

export function ticketSortFunction(
  a: TicketWitchContacts,
  b: TicketWitchContacts,
) {
  // Sort by billing name
  if (a.billing_id !== b.billing_id) a.billing_id.localeCompare(b.billing_id);
  // if (a.billing != null && b.billing == null) return -1;
  // if (a.billing != null && b.billing != null) {
  //   if (a.billing.name == null && b.billing.name != null) return 1;
  //   if (a.billing.name != null && b.billing.name == null) return -1;
  //   if (a.billing.name != null && b.billing.name != null) {
  //     if (a.billing.name < b.billing.name) return -1;
  //     if (a.billing.name > b.billing.name) return 1;
  //   }
  // }
  // Sort by type (VIP first)
  if (!a.type.is_vip && b.type.is_vip) return 1;
  if (a.type.is_vip && !b.type.is_vip) return -1;
  // Sort by guest name
  if (a.guest_id !== b.guest_id) a.guest_id.localeCompare(b.guest_id);
  // if (a.guest == null && b.guest != null) return 1;
  // if (a.guest != null && b.guest == null) return -1;
  // if (a.guest != null && b.guest != null) {
  //   if (a.guest.name == null && b.guest.name != null) return 1;
  //   if (a.guest.name != null && b.guest.name == null) return -1;
  //   if (a.guest.name != null && b.guest.name != null) {
  //     if (a.guest.name < b.guest.name) return -1;
  //     if (a.guest.name > b.guest.name) return 1;
  //   }
  // }
  return 0;
}
