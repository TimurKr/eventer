import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { TicketTypes, EventWithTickets, fetchEvents } from "./serverActions";
import { DraftFunction, Updater } from "use-immer";
import { createContext } from "react";
import { ticketSortFunction } from "./utils";
import { Contacts, Events, Tickets } from "@/utils/supabase/database.types";

type State = {
  events: EventWithTickets[];
  ticketTypes: TicketTypes;
  isRefreshing: boolean;
};

type Actions = {
  refresh: () => Promise<void>;

  setEvents: (events: State["events"]) => void;
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
        const { data: events, error } = await fetchEvents();
        if (error) {
          console.error(error);
        } else {
          set((state) => {
            state.events = events;
            state.events.forEach((event) => {
              event.tickets.sort(ticketSortFunction);
              event.cancelled_tickets.sort(ticketSortFunction);
            });
            state.isRefreshing = false;
          });
        }
      },
      setEvents: (events) =>
        set((state) => {
          state.events = events;
        }),
      addEvent: (event) =>
        set((state) => {
          state.events.push(event);
          state.events.sort((a, b) => {
            return (
              new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
            );
          });
        }),
      removeEvent: (eventId) =>
        set((state) => {
          state.events = state.events.filter((event) => event.id !== eventId);
        }),
      toggleEventIsPublic: (eventId) =>
        set((state) => {
          const event = state.events.find((event) => event.id === eventId)!;
          event.is_public = !event.is_public;
        }),

      addTickets: (eventId, tickets) =>
        set((state) => {
          const event = state.events.find((event) => event.id === eventId)!;
          event.tickets.push(
            ...tickets.filter((t) => t.payment_status !== "zrušené"),
          );
          event.cancelled_tickets.push(
            ...tickets.filter((t) => t.payment_status === "zrušené"),
          );
          event.tickets.sort(ticketSortFunction);
          event.cancelled_tickets.sort(ticketSortFunction);
        }),
      removeTicket: (ticketId) =>
        set((state) => {
          state.events.forEach((event) => {
            event.tickets = event.tickets.filter((t) => t.id !== ticketId);
            event.cancelled_tickets = event.cancelled_tickets.filter(
              (t) => t.id !== ticketId,
            );
          });
        }),
      setPartialTicket: (ticket) =>
        set((state) => {
          state.events.forEach((event) => {
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
        }),
      setTicketsStatus: (ticketIds, newStatus) =>
        set((state) => {
          state.events.forEach((event) => {
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
        }),

      setPartialContact: (contact) =>
        set((state) => {
          state.events.forEach((event) => {
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
        }),
    })),
  );
};

export const EventsContext = createContext<EventsStore | null>(null);
