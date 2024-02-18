import {
  EventWithTickets as fetchEventsReturnType,
  Contacts,
} from "../serverActions";
import { ticketSortFunction } from "../utils";
import { Tickets } from "@/utils/supabase/database.types";
import Fuse from "fuse.js";

export type Events = fetchEventsReturnType & {
  lockedArrived: boolean;
  showCancelledTickets: boolean;
  isExpanded: boolean;
};

export function search(
  events: Events[],
  term: string,
  contacts: Contacts[],
): { events: Events[]; highlightedTicketIds: Tickets["id"][] } {
  let result = events.map((event) => ({
    ...event,
    tickets: event.tickets.map((ticket) => ({
      ...ticket,
      billing: contacts.find((c) => c.id === ticket.billing_id),
      guest: contacts.find((c) => c.id === ticket.guest_id),
    })),
    cancelled_tickets: event.cancelled_tickets.map((ticket) => ({
      ...ticket,
      billing: contacts.find((c) => c.id === ticket.billing_id),
      guest: contacts.find((c) => c.id === ticket.guest_id),
    })),
  }));

  if (term === "") {
    return { events: events, highlightedTicketIds: [] };
  }

  const keys = [
    "id",
    "guest.name",
    "guest.email",
    "guest.phone",
    "billing.name",
    "billing.email",
    "billing.phone",
  ];

  // First find all events that have some mathching tickets
  result = new Fuse(result, {
    keys: keys.flatMap((k) => ["tickets." + k, "cancelled_tickets." + k]),
    shouldSort: false,
    useExtendedSearch: true,
  })
    .search(term)
    .map((r) => r.item);

  // Then for each event find the matching tickets and add tem to highlighted
  const fuse2 = new Fuse<Events["tickets"][0]>([], {
    keys: keys,
    shouldSort: false,
    useExtendedSearch: true,
  });

  return {
    events: result,
    highlightedTicketIds: result.flatMap((event) => {
      fuse2.setCollection([...event.tickets, ...event.cancelled_tickets]);
      return fuse2.search(term).map((r) => r.item.id);
    }),
  };
}

export function mergeNewEvents({
  newEvents,
  oldEvents,
  searchTerm,
  contacts = [],
}: {
  newEvents: fetchEventsReturnType[];
  oldEvents?: Events[];
  searchTerm?: string;
  contacts?: Contacts[];
}): {
  allEvents: Events[];
  events: Events[];
  highlightedTicketIds: Tickets["id"][];
} {
  const allEvents = newEvents.map((event) => ({
    ...(oldEvents?.find((e) => e.id === event.id) || {
      lockedArrived: true,
      showCancelledTickets: false,
      isExpanded: false,
    }),
    ...event,
    tickets: event.tickets.sort(ticketSortFunction),
    cancelled_tickets: event.cancelled_tickets.sort(ticketSortFunction),
  }));
  if (!searchTerm) {
    return { allEvents, events: allEvents, highlightedTicketIds: [] };
  }
  const { events, highlightedTicketIds } = search(
    allEvents,
    searchTerm,
    contacts,
  );
  return { allEvents, events, highlightedTicketIds };
}
