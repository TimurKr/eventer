"use client";

import EventDetail from "@/components/EventDetail";
import Loading from "@/components/Loading";
import { useBrowserUser } from "@/lib/supabase/browser";
import { useRxData } from "@/rxdb/db";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import moment from "moment";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import Header from "../../../components/Header";
import ServiceForm from "../services/edit/form";
import EditEventButton from "./edit-event/button";
import EditEventForm from "./edit-event/form";
import { searchTickets } from "./utils";

export default function Page() {
  const q = useSearchParams().get("query");
  const [query, setQuery] = useState(q || "");

  const { user } = useBrowserUser();

  const { result: allServices, isFetching: servicesFetching } = useRxData(
    "services",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            business_id: {
              $eq: user?.id,
            },
          },
        }),
      [user],
    ),
    { hold: !user, initialResult: [] },
  );

  const { result: allEvents, isFetching: eventsFetching } = useRxData(
    "events",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            service_id: {
              $in: allServices?.map((s) => s.id) || [],
            },
          },
          sort: [{ datetime: "desc" }],
        }),
      [allServices],
    ),
    { hold: servicesFetching, initialResult: [] },
  );

  const { result: allTickets, isFetching: ticketsFetching } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            event_id: { $in: allEvents?.map((e) => e.id) || [] },
          },
        }),
      [allEvents],
    ),
    { hold: eventsFetching, initialResult: [] },
  );

  const { result: allContacts, isFetching: contactsFetching } = useRxData(
    "contacts",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            id: {
              $in:
                allTickets?.map((t) => [t.billing_id, t.guest_id]).flat() || [],
            },
          },
        }),
      [allTickets],
    ),
    { hold: ticketsFetching, initialResult: [] },
  );

  const highlightedTickets = useMemo(
    () =>
      query && allContacts && allTickets
        ? searchTickets(query, {
            tickets: allTickets,
            contacts: allContacts,
          })
        : undefined,
    [allContacts, allTickets, query],
  );

  const events = useMemo(
    () =>
      (highlightedTickets
        ? allEvents.filter((e) =>
            highlightedTickets.some((t) => t.event_id === e.id),
          )
        : allEvents
      ).map((e) => ({
        data: e,
        tickets: allTickets.filter((t) => t.event_id === e.id),
      })),
    [allEvents, allTickets, highlightedTickets],
  );

  const { previousEvents, todayEvents, futureEvents } = useMemo(
    () => ({
      previousEvents: events.filter((e) =>
        moment(e.data.datetime).endOf("D").isBefore(moment()),
      ),
      todayEvents: events.filter((e) =>
        moment(e.data.datetime).isSame(moment(), "D"),
      ),
      futureEvents: events.filter((e) =>
        moment(e.data.datetime).startOf("D").isAfter(moment()),
      ),
    }),
    [events],
  );

  const isFetching =
    servicesFetching || eventsFetching || ticketsFetching || contactsFetching;

  return (
    <>
      <Header
        title="Udalosti"
        search={{
          search: (query) => setQuery(query),
          query,
          resultsCount: highlightedTickets?.length || 0,
        }}
        actionButton={allServices.length > 0 && <EditEventButton />}
      />
      {events.length > 0 ? (
        <div className={`flex w-auto flex-col gap-4 p-4 pt-0`}>
          {futureEvents.map((event) => (
            <EventDetail
              key={event.data.id}
              event={event.data}
              tickets={event.tickets}
              allHighlightedTickets={highlightedTickets}
            />
          ))}
          {todayEvents.length > 0 && (
            <div className="m-3 flex items-center">
              <p className="font-medium text-orange-400">Dnes</p>
              <div className="mx-4 h-px grow bg-gray-200" />
            </div>
          )}
          {todayEvents.map((event) => (
            <EventDetail
              key={event.data.id}
              event={event.data}
              tickets={event.tickets}
              allHighlightedTickets={highlightedTickets}
            />
          ))}
          {previousEvents.length > 0 && (
            <div className="m-3 flex items-center">
              <p className="text-sm font-medium text-gray-600">História</p>
              <div className="mx-4 h-px grow bg-gray-200" />
            </div>
          )}
          {previousEvents.map((event) => (
            <EventDetail
              key={event.data.id}
              event={event.data}
              tickets={event.tickets}
              allHighlightedTickets={highlightedTickets}
            />
          ))}
        </div>
      ) : isFetching ? (
        <Loading text="Načítavam udalosti..." />
      ) : allServices.length === 0 ? (
        <div className="flex flex-col items-center p-10">
          <RocketLaunchIcon className="w-12 text-gray-400" />
          <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
            Vytvorte si svoje prvé predstavenie
          </p>
          <div className="rounded-2xl border border-gray-200 p-4 shadow-md">
            <ServiceForm onSubmit={() => {}} />
          </div>
        </div>
      ) : query ? (
        <div className="flex flex-col items-center p-10">
          <MagnifyingGlassIcon className="w-12 animate-wiggle text-gray-400" />
          <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
            Nenašli sme žiadne lístky vyhovujúce vášmu hladaniu...
          </p>
          <EditEventButton />
        </div>
      ) : (
        <div className="flex flex-col items-center p-10">
          <RocketLaunchIcon className="w-12 text-gray-400" />
          <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
            Skvelé! Máte vytvorené predstavenie, teraz už len vytvoriť prvú
            udalosť
          </p>
          <div className="rounded-2xl border border-gray-200 p-4 shadow-lg">
            <EditEventForm onSubmit={() => {}} />
          </div>
        </div>
      )}
    </>
  );
}
