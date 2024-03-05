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
    tickets?: TicketsDocument[];
    contacts?: ContactsDocument[];
  },
): TicketsDocument[] {
  if (!tickets || !contacts) return [];

  // Prepare data
  let data = tickets.map((t) => ({
    ...t,
    billing: contacts.find((c) => c.id === t.billing_id),
    guest: contacts.find((c) => c.id === t.guest_id),
  }));

  if (term === "") {
    return tickets;
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

  // Then for each event find the matching tickets and add tem to highlighted
  const fuse2 = new Fuse(data, {
    keys: keys,
    shouldSort: false,
    useExtendedSearch: true,
  });

  return fuse2.search(term).map((r) => r.item);
}

// export function mergeNewEvents({
//   newEvents,
//   oldEvents,
//   searchTerm,
//   contacts = [],
// }: {
//   newEvents: fetchEventsReturnType[];
//   oldEvents?: Events[];
//   searchTerm?: string;
//   contacts?: Contacts[];
// }): {
//   allEvents: Events[];
//   events: Events[];
//   highlightedTicketIds: Tickets["id"][];
// } {
//   const allEvents = newEvents.map((event) => ({
//     ...(oldEvents?.find((e) => e.id === event.id) || {
//       lockedArrived: true,
//       showCancelledTickets: false,
//       isExpanded: false,
//     }),
//     ...event,
//     tickets: event.tickets.sort(ticketSortFunction),
//     cancelled_tickets: event.cancelled_tickets.sort(ticketSortFunction),
//   }));
//   if (!searchTerm) {
//     return { allEvents, events: allEvents, highlightedTicketIds: [] };
//   }
//   const { events, highlightedTicketIds } = search(
//     allEvents,
//     searchTerm,
//     contacts,
//   );
//   return { allEvents, events, highlightedTicketIds };
// }
