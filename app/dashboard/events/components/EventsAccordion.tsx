"use client";

import { useRef } from "react";
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { type EventWithTickets, fetchTicketTypes } from "../serverActions";
import NewEventModal from "../NewEventModal";
import { EventsContext, createEventsStore } from "../zustand";
import { useStore } from "zustand";
import { useSearchParams } from "next/navigation";
import React from "react";
import EventRow from "./EventRow";

export default function EventsAccordion(props: {
  events: EventWithTickets[];
  ticketTypes: Awaited<ReturnType<typeof fetchTicketTypes>>["data"];
}) {
  const store = useRef(
    createEventsStore({
      events: props.events,
      allEvents: props.events,
      ticketTypes: props.ticketTypes,
    }),
  ).current;

  const { events, isRefreshing, refresh, search, searchTerm } = useStore(
    store,
    (state) => state,
  );

  const searchParams = useSearchParams();
  if (searchParams.get("search")) search(searchParams.get("search")!);

  return (
    <EventsContext.Provider value={store}>
      <div className="flex items-center justify-between gap-4 pb-2">
        <span className="text-2xl font-bold tracking-wider">
          Termíny Tajomných Variácií
        </span>
        <div className="relative grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 grid place-content-center">
            <MagnifyingGlassIcon className="h-8 w-8 p-2 text-gray-500" />
          </div>
          <input
            type="text"
            className="z-10 w-full rounded-md border-gray-200 bg-transparent py-0.5 ps-8"
            placeholder="Hladať"
            value={searchTerm}
            onChange={(e) => search(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == "Escape") {
                (e.target as HTMLInputElement).blur();
              }
              if (e.key == "Enter") {
                search(searchTerm);
              }
            }}
          />
        </div>
        <button
          className="flex items-center gap-2 rounded-md border border-gray-200 p-1 px-2 text-sm font-normal hover:bg-gray-100"
          onClick={refresh}
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${isRefreshing && "animate-spin"}`}
          />
          Obnoviť
        </button>
        <NewEventModal />
      </div>
      <ul
        role="list"
        className={`w-auto divide-y divide-gray-300 rounded-xl border border-gray-200 p-2`}
      >
        {events.map((event) => (
          <EventRow key={event.id} eventId={event.id} />
        ))}
      </ul>
    </EventsContext.Provider>
  );
}
