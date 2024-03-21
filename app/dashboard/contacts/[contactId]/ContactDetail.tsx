"use client";

import EventDetail from "@/components/EventDetail";
import InlineLoading from "@/components/InlineLoading";
import Loading from "@/components/Loading";
import NoResults from "@/components/NoResults";
import { InstantTextField } from "@/components/forms/InstantFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { string as yupString } from "yup";

export default function ContactDetail({ id }: { id: ContactsDocument["id"] }) {
  const {
    result: contact,
    collection: contactsCollection,
    isFetching: isFetchingContact,
  } = useRxData(
    "contacts",
    useCallback((c) => c.findOne(id), [id]),
  );

  const {
    result: tickets,
    isFetching: fetchingTickets,
    collection: ticketsCollection,
  } = useRxData(
    "tickets",
    useCallback(
      (c) =>
        c.find({ selector: { $or: [{ guest_id: id }, { billing_id: id }] } }),
      [id],
    ),
    { initialResult: [] },
  );

  const { result: events, isFetching } = useRxData(
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

  const {
    result: coupons,
    isFetching: fetchingCoupons,
    collection: couponsCollection,
  } = useRxData(
    "coupons",
    useCallback(
      (c) =>
        c.find({
          selector: { contact_id: id },
        }),
      [id],
    ),
    { hold: fetchingTickets, initialResult: [] },
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

  const router = useRouter();

  const updateContactField = async <
    K extends keyof Pick<ContactsDocument, "name" | "email" | "phone">,
  >(
    field: K,
    value: ContactsDocument[K],
  ): Promise<string> => {
    if (!contact) {
      console.error("Contact not found");
      return "";
    }
    const origValue = contact[field] || "";
    const { _attachments, _deleted, _meta, _rev, id, created_at, ...newData } =
      {
        ...contact?._data,
        [field]: value,
      };
    const duplicate = await contactsCollection
      ?.findOne({ selector: newData })
      .exec();
    if (duplicate) {
      if (!confirm("Kontakt s týmito údajmi už existuje. Chcete ich spojiť?"))
        return origValue;
      if (!ticketsCollection || !couponsCollection) {
        console.error("Tickets collection not found");
        return origValue;
      }
      const guestMentions = await ticketsCollection
        .find({ selector: { guest_id: contact?.id || "NOT ID" } })
        .exec();
      const billingMentions = await ticketsCollection
        .find({ selector: { billing_id: contact?.id || "NOT ID" } })
        .exec();
      const couponMentions = await couponsCollection
        .find({ selector: { contact_id: contact?.id || "NOT ID" } })
        .exec();

      const guestPromises = guestMentions.map((t) =>
        t.incrementalPatch({ guest_id: duplicate.id }),
      );
      const billingPromises = billingMentions.map((t) =>
        t.incrementalPatch({ billing_id: duplicate.id }),
      );
      const couponPromises = couponMentions.map((c) =>
        c.incrementalPatch({ contact_id: duplicate.id }),
      );
      await Promise.all([
        ...guestPromises,
        ...billingPromises,
        ...couponPromises,
      ]);
      // remove the old contact
      await contact?.remove();
      router.push(`/dashboard/contacts/${duplicate.id}`);
    }
    return (await contact.incrementalPatch({ [field]: value }))[field] || "";
  };

  if (!isFetchingContact && !contact) {
    return <NoResults text="Kontakt neexistuje" />;
  }

  return (
    <div>
      <h1 className="p-2 text-2xl font-bold tracking-wider">
        {contact?.name || <InlineLoading />}
      </h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <InstantTextField
          defaultValue={contact?.name || ""}
          updateValue={(v) => updateContactField("name", v)}
          type="text"
          label="Meno"
          trim
          vertical
          validate={async (v) => (v ? null : "Meno je povinné")}
          baseClassName="grow"
        />
        <InstantTextField
          defaultValue={contact?.email || ""}
          updateValue={(v) => updateContactField("email", v)}
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
          updateValue={(v) => updateContactField("phone", v)}
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
          {isFetching ? (
            <Loading text="Načítavam lístky..." />
          ) : groupedTickets.length === 0 ? (
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
