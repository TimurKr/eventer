import { ContactsDocument } from "@/rxdb/schemas/public/contacts";

export function contactsEqual(
  a: Pick<ContactsDocument, "name" | "email" | "phone">,
  b: Pick<ContactsDocument, "name" | "email" | "phone">,
) {
  return a.name == b.name && a.email == b.email && a.phone == b.phone;
}

export const TicketsSorting = [
  { billing_id: "asc" },
  { type_id: "asc" },
  { guest_id: "asc" },
] as Record<string, "asc" | "desc">[];
