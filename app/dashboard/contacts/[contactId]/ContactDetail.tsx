"use client";

import EventDetail from "@/components/Event";
import InlineLoading from "@/components/InlineLoading";
import NoResults from "@/components/NoResults";
import { InstantTextField } from "@/components/forms/InstantFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { useCallback, useMemo } from "react";
import { string as yupString } from "yup";

export default function ContactDetail({ id }: { id: ContactsDocument["id"] }) {
  const { result: contact } = useRxData(
    "contacts",
    useCallback((c) => c.findOne(id), [id]),
  );

  const { result: tickets, isFetching: fetchingTickets } = useRxData(
    "tickets",
    useCallback(
      (c) =>
        c.find({ selector: { $or: [{ guest_id: id }, { billing_id: id }] } }),
      [id],
    ),
    { initialResult: [] },
  );

  const { result: events, isFetching: fetchingEvents } = useRxData(
    "events",
    useCallback(
      (c) =>
        c.find({
          selector: { id: { $in: tickets.map((t) => t.event_id) } },
          sort: [{ datetime: "desc" }],
        }),
      [tickets],
    ),
    { hold: fetchingTickets, initialResult: [] },
  );

  const { result: services } = useRxData(
    "services",
    useCallback(
      (c) =>
        c.find({
          selector: { id: { $in: events.map((e) => e.service_id) } },
        }),
      [events],
    ),
    { initialResult: [], hold: fetchingEvents },
  );

  const groupedTickets = useMemo(
    () =>
      events
        .filter((v, i, a) => a.findIndex((v2) => v.id === v2.id) === i)
        .map((e) => ({
          event: e,
          tickets: tickets.filter((t) => t.event_id === e.id),
        })),
    [events, tickets],
  );

  return (
    <div>
      <h1 className="p-2 text-2xl font-bold tracking-wider">
        {contact?.name || <InlineLoading />}
      </h1>

      <div className="gep-2 flex">
        <InstantTextField
          defaultValue={contact?.name || ""}
          updateValue={(v) => contact?.incrementalPatch({ name: v! })}
          type="text"
          label="Meno"
          trim
          vertical
          validate={async (v) => (v ? null : "Meno je povinné")}
          baseClassName="grow"
        />
        <InstantTextField
          defaultValue={contact?.email || ""}
          updateValue={(v) => contact?.incrementalPatch({ email: v || "" })}
          baseClassName="grow"
          type="email"
          label="Email"
          vertical
          trim
          placeholder="email@príklad.com"
          validate={(value) =>
            yupString()
              .email("Zadajte platný email")
              .validate(value)
              .then(() => null)
              .catch((err) => err.message)
          }
        />
        <InstantTextField
          defaultValue={contact?.phone || ""}
          updateValue={(v) => contact?.incrementalPatch({ phone: v || "" })}
          baseClassName="grow"
          type="text"
          label="Telefón"
          vertical
          trim
          placeholder="+421 *** *** ***"
        />
      </div>
      <Tabs defaultValue="tickets" className="pt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">Lístky</TabsTrigger>
          <TabsTrigger value="coupons">Kupóny</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
          {groupedTickets.length === 0 ? (
            <NoResults text="Tento kontakt nie je použitý pri žiadnom lístku" /> //TODO: Pridať možnosť pridania lístku s autofill
          ) : (
            <div className="flex flex-col gap-4">
              {groupedTickets.map((event, i) => (
                <EventDetail
                  key={i}
                  {...event}
                  editable={false}
                  hideCancelled={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="coupons">
          <p>Coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
