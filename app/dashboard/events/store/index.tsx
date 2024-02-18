import { createStoreSlice } from "zimmer-context";
import { fetchEvents, fetchContacts, Contacts } from "../serverActions";
import { ticketSortFunction } from "../utils";
import { Tickets } from "@/utils/supabase/database.types";
import { type Events, mergeNewEvents, search } from "./helpers";

type State = {
  events: Events[];
  allEvents: Events[];
  searchTerm: string;
  highlightedTicketIds: Tickets["id"][];
  selectedTicketIds: Tickets["id"][];
  // ticketTypes: TicketTypes[];
  isRefreshing: boolean;
  contacts: Contacts[];
};

type Actions = {
  refresh: () => Promise<void>;
  search: (props?: { query?: string; allEvents?: Events[] }) => void;

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

  addContacts: (contacts: Contacts[]) => void;
  setPartialContact: (
    contact: Partial<Contacts> & { id: NonNullable<Contacts["id"]> },
  ) => void;
};

const eventsSlice = createStoreSlice<State, Actions>((set, get, store) => ({
  events: [],
  allEvents: [],
  searchTerm: "",
  highlightedTicketIds: [],
  selectedTicketIds: [],
  // ticketTypes: [],
  contacts: [],
  isRefreshing: false,
  refresh: async () => {
    set((state) => {
      state.isRefreshing = !state.isRefreshing;
    });
    const eventsQuery = fetchEvents();
    const contactsQuery = fetchContacts();
    const [resEvents, resContacts] = await Promise.all([
      eventsQuery,
      contactsQuery,
    ]);

    if (resEvents.error) {
      throw new Error(resEvents.error.message);
    }
    if (resContacts.error) {
      throw new Error(resContacts.error.message);
    }
    set((state) => {
      state.contacts = resContacts.data;
      const { allEvents, events, highlightedTicketIds } = mergeNewEvents({
        newEvents: resEvents.data,
        oldEvents: state.allEvents,
        searchTerm: state.searchTerm,
      });
      // state.allEvents = resEvents.data.map((event) => ({
      //   ...(state.allEvents?.find((e) => e.id === event.id) || {
      //     lockedArrived: true,
      //     showCancelledTickets: false,
      //     isExpanded: false,
      //   }),
      //   ...event,
      // }));
      // state.allEvents.forEach((event) => {
      //   event.tickets.sort(ticketSortFunction);
      //   event.cancelled_tickets.sort(ticketSortFunction);
      // });
      state.isRefreshing = false;
      const r = search(state.allEvents, state.searchTerm, state.contacts);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },

  search: ({ query, allEvents } = {}) =>
    set((state) => {
      query = query === undefined ? state.searchTerm : query;
      state.searchTerm = query;
      if (query === "") {
        state.events = allEvents || state.allEvents;
        state.highlightedTicketIds = [];
        return;
      }
      const r = search(allEvents || state.allEvents, query, state.contacts);
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
      const r = search(state.allEvents, state.searchTerm, state.contacts);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  removeEvent: (eventId) => {
    set((state) => {
      state.allEvents = state.allEvents.filter((event) => event.id !== eventId);
      const r = search(state.allEvents, state.searchTerm, state.contacts);
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
      const r = search(state.allEvents, state.searchTerm, state.contacts);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },

  toggleEventIsExpanded: (eventId) => {
    set((state) => {
      const event = state.allEvents.find((event) => event.id === eventId)!;
      event.isExpanded = !event.isExpanded;
      const r = search(state.allEvents, state.searchTerm, state.contacts);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  toggleEventShowCancelledTickets: (eventId) => {
    set((state) => {
      const event = state.allEvents.find((event) => event.id === eventId)!;
      event.showCancelledTickets = !event.showCancelledTickets;
      const r = search(state.allEvents, state.searchTerm, state.contacts);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  toggleEventLockedArrived: (eventId) => {
    set((state) => {
      const event = state.allEvents.find((event) => event.id === eventId)!;
      event.lockedArrived = !event.lockedArrived;
      const r = search(state.allEvents, state.searchTerm, state.contacts);
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
      const r = search(state.allEvents, state.searchTerm, state.contacts);
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
      const r = search(state.allEvents, state.searchTerm, state.contacts);
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
      const r = search(state.allEvents, state.searchTerm, state.contacts);
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
      const r = search(state.allEvents, state.searchTerm, state.contacts);
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
      const r = search(state.allEvents, state.searchTerm, state.contacts);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  addContacts: (contacts) => {
    set((state) => {
      state.contacts = [...contacts, ...state.contacts];
      const r = search(state.allEvents, state.searchTerm, state.contacts);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
  setPartialContact: (contact) => {
    set((state) => {
      state.contacts = state.contacts.map((c) =>
        c.id === contact.id ? { ...c, ...contact } : c,
      );
      const r = search(state.allEvents, state.searchTerm, state.contacts);
      state.events = r.events;
      state.highlightedTicketIds = r.highlightedTicketIds;
    });
  },
}));

export default eventsSlice;