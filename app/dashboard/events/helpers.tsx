import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import Fuse from "fuse.js";

export function searchEvents(
  term: string,
  {
    events,
    tickets,
    contacts,
  }: {
    events?: EventsDocument[];
    tickets?: TicketsDocument[];
    contacts?: ContactsDocument[];
  },
): EventsDocument[] {
  if (!events || !tickets || !contacts) return [];

  // Prepare data
  let ticketsWithContacts = tickets.map((t) => ({
    ...t,
    billing: contacts.find((c) => c.id === t.billing_id),
    guest: contacts.find((c) => c.id === t.guest_id),
  }));
  let data = events.map((event) => ({
    ...event,
    tickets: ticketsWithContacts.filter((t) => t.event_id === event.id),
  }));

  if (term === "") {
    return events;
  }

  // First find all relevant events
  const keys = [
    "id",
    "guest.name",
    "guest.email",
    "guest.phone",
    "billing.name",
    "billing.email",
    "billing.phone",
  ];

  return new Fuse(data, {
    keys: keys.map((k) => "tickets." + k),
    shouldSort: false,
    useExtendedSearch: true,
  })
    .search(term)
    .map((r) => r.item);
}

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
