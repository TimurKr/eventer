import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import Fuse from "fuse.js";

export function contactsEqual(
  a: Partial<Pick<ContactsDocument, "name" | "email" | "phone">>,
  b: Partial<Pick<ContactsDocument, "name" | "email" | "phone">>,
) {
  return a.name == b.name && a.email == b.email && a.phone == b.phone;
}

export const TicketsSorting = [
  { billing_id: "asc" },
  { type_id: "asc" },
  { guest_id: "asc" },
] as Record<string, "asc" | "desc">[];

export function searchTickets(
  term: string,
  {
    tickets,
    contacts,
  }: {
    tickets: TicketsDocument[];
    contacts: ContactsDocument[];
  },
) {
  if (term === "") {
    return [];
  }

  // Prepare data
  let data = tickets.map((ticket) => ({
    ticket,
    billing: contacts.find((c) => c.id === ticket.billing_id),
    guest: contacts.find((c) => c.id === ticket.guest_id),
  }));

  const keys = [
    "ticket.id",
    "ticket.note",
    "guest.name",
    "guest.email",
    "guest.phone",
    "billing.name",
    "billing.email",
    "billing.phone",
  ];

  // Then for each event find the matching tickets and add tem to highlighted
  const fuse = new Fuse(data, {
    keys: keys,
    shouldSort: false,
    useExtendedSearch: true,
  });

  const result = fuse.search(term).map((r) => r.item.ticket);

  return result;
}
