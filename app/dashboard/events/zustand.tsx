import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { TicketTypes, EventWithTickets, fetchEvents } from "./serverActions";
import { createContext } from "react";
import { ticketSortFunction } from "./utils";
import { Contacts, Events, Tickets } from "@/utils/supabase/database.types";
import Fuse from "fuse.js";

function search(
  events: EventWithTickets[],
  term: string,
): { events: EventWithTickets[]; highlightedTicketIds: Tickets["id"][] } {
  if (term === "") {
    return { events: events, highlightedTicketIds: [] };
  }

  const keys = ["guest.name"];

  // First find all events that have some mathching tickets
  const fuse1 = new Fuse<EventWithTickets>(events, {
    keys: keys.flatMap((k) => ["tickets." + k, "cancelled_tickets." + k]),
    shouldSort: false,
  });
  events = fuse1.search(term).map((r) => r.item);
  console.log("count: %d", events.length);

  // Then for each event find the matching tickets and add tem to highlighted
  const fuse2 = new Fuse<EventWithTickets["tickets"][0]>([], {
    keys: keys,
    shouldSort: false,
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
  events: EventWithTickets[];
  allEvents: EventWithTickets[];
  searchTerm: string;
  highlightedTicketIds: Tickets["id"][];
  ticketTypes: TicketTypes;
  isRefreshing: boolean;
};

type Actions = {
  refresh: () => Promise<void>;
  search: (term: string, allEvents?: EventWithTickets[]) => void;

  addEvent: (event: State["events"][0]) => void;
  removeEvent: (eventId: number) => void;
  toggleEventIsPublic: (eventId: Events["id"]) => void;

  addTickets: (
    eventId: Events["id"],
    tickets: State["events"][0]["tickets"],
  ) => void;
  removeTicket: (ticketId: Tickets["id"]) => void;
  setPartialTicket: (
    ticket: Partial<EventWithTickets["tickets"][0]> & {
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

export type EventsStore = ReturnType<typeof createEventsStore>;

export const createEventsStore = (props?: Partial<State>) => {
  const defaultProps: State = {
    events: [],
    allEvents: [],
    highlightedTicketIds: [],
    searchTerm: "",
    ticketTypes: [],
    isRefreshing: false,
  };
  return createStore<State & Actions>()(
    immer((set) => ({
      ...defaultProps,
      ...props,
      refresh: async () => {
        set((state) => {
          state.isRefreshing = !state.isRefreshing;
        });
        const { data: allEvents, error } = await fetchEvents();
        if (error) {
          console.error(error);
        } else {
          set((state) => {
            state.allEvents = allEvents;
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
              new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
          );
          const r = search(state.allEvents, state.searchTerm);
          state.events = r.events;
          state.highlightedTicketIds = r.highlightedTicketIds;
        });
      },

      removeEvent: (eventId) => {
        set((state) => {
          state.allEvents = state.allEvents.filter(
            (event) => event.id !== eventId,
          );
          const r = search(state.allEvents, state.searchTerm);
          state.events = r.events;
          state.highlightedTicketIds = r.highlightedTicketIds;
        });
      },
      toggleEventIsPublic: (eventId) => {
        set((state) => {
          const event = state.allEvents.find((event) => event.id === eventId)!;
          event.is_public = !event.is_public;
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
      removeTicket: (ticketId) => {
        set((state) => {
          state.allEvents.forEach((event) => {
            event.tickets = event.tickets.filter((t) => t.id !== ticketId);
            event.cancelled_tickets = event.cancelled_tickets.filter(
              (t) => t.id !== ticketId,
            );
          });
          const r = search(state.allEvents, state.searchTerm);
          state.events = r.events;
          state.highlightedTicketIds = r.highlightedTicketIds;
        });
      },
      setPartialTicket: (ticket) => {
        set((state) => {
          state.allEvents.forEach((event) => {
            let ticketIndex = event.tickets.findIndex(
              (t) => t.id === ticket.id,
            );
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
            if (!event.tickets.find((t) => ticketIds.includes(t.id))) return;
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

      setPartialContact: (contact) =>
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
        }),
    })),
  );
};

export const EventsContext = createContext<EventsStore | null>(null);
