import {
  TicketTypes,
  EventWithTickets as fetchEventsReturnType,
  fetchEvents,
  fetchTicketTypes,
} from "./serverActions";
import { ticketSortFunction } from "./utils";
import { Contacts, Tickets } from "@/utils/supabase/database.types";
import Fuse from "fuse.js";
import { createStoreSlice } from "@/utils/zustand";

type Events = fetchEventsReturnType & {
  lockedArrived: boolean;
  showCancelledTickets: boolean;
  isExpanded: boolean;
};

function search(
  events: Events[],
  term: string,
): { events: Events[]; highlightedTicketIds: Tickets["id"][] } {
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
  const fuse1 = new Fuse<Events>(events, {
    keys: keys.flatMap((k) => ["tickets." + k, "cancelled_tickets." + k]),
    shouldSort: false,
    useExtendedSearch: true,
  });
  events = fuse1.search(term).map((r) => r.item);
  console.log("count: %d", events.length);

  // Then for each event find the matching tickets and add tem to highlighted
  const fuse2 = new Fuse<Events["tickets"][0]>([], {
    keys: keys,
    shouldSort: false,
    useExtendedSearch: true,
  });

  return {
    events: events,
    highlightedTicketIds: events.flatMap((event) => {
      fuse2.setCollection([...event.tickets, ...event.cancelled_tickets]);
      return fuse2.search(term).map((r) => r.item.id);
    }),
  };
}

type State = {
  events: Events[];
  allEvents: Events[];
  searchTerm: string;
  highlightedTicketIds: Tickets["id"][];
  selectedTicketIds: Tickets["id"][];
  ticketTypes: TicketTypes[];
  isRefreshing: boolean;
};

type Actions = {
  refresh: () => Promise<void>;
  search: (term: string, allEvents?: Events[]) => void;

  addEvent: (event: Events) => void;
  removeEvent: (eventId: number) => void;
  setPartialEvent: (event: Partial<Events>) => void;
  toggleEventIsExpanded: (eventId: Events["id"]) => void;
  toggleEventShowCancelledTickets: (eventId: Events["id"]) => void;
  toggleEventLockedArrived: (eventId: Events["id"]) => void;
  toggleSelectedTicket: (ticketId: Tickets["id"]) => void;

  addTickets: (eventId: Events["id"], tickets: Events["tickets"]) => void;
  removeTickets: (ticketIds: Tickets["id"][]) => void;
  setPartialTicket: (
    ticket: Partial<Events["tickets"][0]> & {
      id: NonNullable<Tickets["id"]>;
    },
  ) => void;
  setTicketsStatus: (
    ticketIds: Tickets["id"][],
    newStatus: Tickets["payment_status"],
  ) => void;

  setPartialContact: (
    contact: Partial<Contacts> & { id: NonNullable<Contacts["id"]> },
  ) => void;
};

const defaultState: State = {
  events: [],
  allEvents: [],
  searchTerm: "",
  highlightedTicketIds: [],
  selectedTicketIds: [],
  ticketTypes: [],
  isRefreshing: false,
};

const eventsSlice = createStoreSlice<State, Actions>((set, get) => ({
  ...defaultState,
  refresh: async () => {
    set((state) => {
      state.isRefreshing = !state.isRefreshing;
    });
    const eventsPromise = fetchEvents();
    const ticketTypesPromise = fetchTicketTypes();
    const [fetchedEventsResponse, fetchedTicketTypesResponse] =
      await Promise.all([eventsPromise, ticketTypesPromise]);

    if (fetchedTicketTypesResponse.error) {
      console.error(fetchedTicketTypesResponse.error);
    } else {
      set((state) => {
        state.ticketTypes = fetchedTicketTypesResponse.data;
      });
    }

    // const { data: events, error } = await fetchEvents();
    if (fetchedEventsResponse.error) {
      console.error(fetchedEventsResponse.error);
    } else {
      set((state) => {
        state.allEvents = fetchedEventsResponse.data.map((event) => ({
          ...(state.allEvents?.find((e) => e.id === event.id) || {
            lockedArrived: true,
            showCancelledTickets: false,
            isExpanded: false,
          }),
          ...event,
        }));
        state.allEvents.forEach((event) => {
          event.tickets.sort(ticketSortFunction);
          event.cancelled_tickets.sort(ticketSortFunction);
        });
        state.isRefreshing = false;
        const r = search(state.allEvents, state.searchTerm);
        state.events = r.events;
        state.highlightedTicketIds = r.highlightedTicketIds;
      });
    }
  },

  search: (term, allEvents) =>
    set((state) => {
      state.searchTerm = term;
      if (term === "") {
        state.events = allEvents || state.allEvents;
        state.highlightedTicketIds = [];
        return;
      }
      const r = search(allEvents || state.allEvents, term);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    }),

  addEvent: (event) => {
    set((state) => {
      state.allEvents.push(event);
      state.allEvents.sort(
        (a, b) =>
          new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
      );
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  removeEvent: (eventId) => {
    set((state) => {
      state.allEvents = state.allEvents.filter((event) => event.id !== eventId);
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  setPartialEvent: (event) => {
    set((state) => {
      const eventIndex = state.allEvents.findIndex((e) => e.id === event.id);
      if (eventIndex === -1) return;
      state.allEvents[eventIndex] = {
        ...state.allEvents[eventIndex],
        ...event,
      };
      state.allEvents.sort(
        (a, b) =>
          new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
      );
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },

  toggleEventIsExpanded: (eventId) => {
    set((state) => {
      const event = state.allEvents.find((event) => event.id === eventId)!;
      event.isExpanded = !event.isExpanded;
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  toggleEventShowCancelledTickets: (eventId) => {
    set((state) => {
      const event = state.allEvents.find((event) => event.id === eventId)!;
      event.showCancelledTickets = !event.showCancelledTickets;
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  toggleEventLockedArrived: (eventId) => {
    set((state) => {
      const event = state.allEvents.find((event) => event.id === eventId)!;
      event.lockedArrived = !event.lockedArrived;
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  toggleSelectedTicket: (ticketId) => {
    set((state) => {
      if (state.selectedTicketIds.includes(ticketId)) {
        state.selectedTicketIds = state.selectedTicketIds.filter(
          (id) => id !== ticketId,
        );
      } else {
        state.selectedTicketIds.push(ticketId);
      }
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },

  addTickets: (eventId, tickets) => {
    set((state) => {
      const event = state.allEvents.find((event) => event.id === eventId)!;
      event.tickets.push(
        ...tickets.filter((t) => t.payment_status !== "zrušené"),
      );
      event.cancelled_tickets.push(
        ...tickets.filter((t) => t.payment_status === "zrušené"),
      );
      event.tickets.sort(ticketSortFunction);
      event.cancelled_tickets.sort(ticketSortFunction);
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  removeTickets: (ticketIds) => {
    set((state) => {
      state.allEvents.forEach((event) => {
        event.tickets = event.tickets.filter((t) => !ticketIds.includes(t.id));
        event.cancelled_tickets = event.cancelled_tickets.filter(
          (t) => !ticketIds.includes(t.id),
        );
      });
      state.selectedTicketIds = state.selectedTicketIds.filter(
        (id) => !ticketIds.includes(id),
      );
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  setPartialTicket: (ticket) => {
    set((state) => {
      state.allEvents.forEach((event) => {
        let ticketIndex = event.tickets.findIndex((t) => t.id === ticket.id);
        if (ticketIndex != -1) {
          event.tickets[ticketIndex] = {
            ...event.tickets[ticketIndex],
            ...ticket,
          };
          event.tickets.sort(ticketSortFunction);
        }
        ticketIndex = event.cancelled_tickets.findIndex(
          (t) => t.id === ticket.id,
        );
        if (ticketIndex != -1) {
          event.cancelled_tickets[ticketIndex] = {
            ...event.cancelled_tickets[ticketIndex],
            ...ticket,
          };
          event.cancelled_tickets.sort(ticketSortFunction);
        }
      });
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  setTicketsStatus: (ticketIds, newStatus) => {
    set((state) => {
      state.allEvents.forEach((event) => {
        if (
          !event.tickets.find((t) => ticketIds.includes(t.id)) &&
          !event.cancelled_tickets.find((t) => ticketIds.includes(t.id))
        )
          return;
        const allTickets = [...event.tickets, ...event.cancelled_tickets];
        allTickets.forEach((ticket) => {
          if (ticketIds.includes(ticket.id)) {
            ticket.payment_status = newStatus;
          }
        });
        event.tickets = allTickets.filter(
          (t) => t.payment_status !== "zrušené",
        );
        event.cancelled_tickets = allTickets.filter(
          (t) => t.payment_status === "zrušené",
        );
        event.tickets.sort(ticketSortFunction);
        event.cancelled_tickets.sort(ticketSortFunction);
      });
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },

  setPartialContact: (contact) => {
    set((state) => {
      state.allEvents.forEach((event) => {
        event.tickets.forEach((ticket) => {
          if (ticket.guest_id === contact.id) {
            ticket.guest = {
              ...ticket.guest!,
              ...contact,
            };
          }
          if (ticket.billing_id === contact.id) {
            ticket.billing = {
              ...ticket.billing!,
              ...contact,
            };
          }
        });
      });
      const r = search(state.allEvents, state.searchTerm);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
}));

export default eventsSlice;
