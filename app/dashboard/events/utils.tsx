import { Contacts, Tickets } from "@/utils/supabase/database.types";

type TicketWitchContacts = Tickets & {
  billing: Contacts | null;
  guest: Contacts | null;
};

export function contactsEqual(a: Partial<Contacts>, b: Partial<Contacts>) {
  return a.name == b.name && a.email == b.email && a.phone == b.phone;
}

export function ticketSortFunction(
  a: TicketWitchContacts,
  b: TicketWitchContacts,
) {
  // Sort by billing name
  if (a.billing == null && b.billing != null) return 1;
  if (a.billing != null && b.billing == null) return -1;
  if (a.billing != null && b.billing != null) {
    if (a.billing.name == null && b.billing.name != null) return 1;
    if (a.billing.name != null && b.billing.name == null) return -1;
    if (a.billing.name != null && b.billing.name != null) {
      if (a.billing.name < b.billing.name) return -1;
      if (a.billing.name > b.billing.name) return 1;
    }
  }
  // Sort by type (VIP first)
  if (a.type != "VIP" && b.type == "VIP") return 1;
  if (a.type == "VIP" && b.type != "VIP") return -1;
  // Sort by guest name
  if (a.guest == null && b.guest != null) return 1;
  if (a.guest != null && b.guest == null) return -1;
  if (a.guest != null && b.guest != null) {
    if (a.guest.name == null && b.guest.name != null) return 1;
    if (a.guest.name != null && b.guest.name == null) return -1;
    if (a.guest.name != null && b.guest.name != null) {
      if (a.guest.name < b.guest.name) return -1;
      if (a.guest.name > b.guest.name) return 1;
    }
  }
  return 0;
}
