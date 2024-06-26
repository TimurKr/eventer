"use client";

import CouponRow from "@/components/CouponRow";
import EventDetail from "@/components/EventDetail";
import InlineLoading from "@/components/InlineLoading";
import Loading from "@/components/Loading";
import NoResults from "@/components/NoResults";
import { InstantTextField } from "@/components/inputs/InstantFields";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button, ConfirmButton } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { string as zString } from "zod";
import NewCouponButton from "../../coupons/new/button";

export default function ContactDetail({ id }: { id: ContactsDocument["id"] }) {
  const {
    result: contact,
    collection: contactsCollection,
    isFetching: isFetchingContact,
  } = useRxData(
    "contacts",
    useCallback((c) => c.findOne(id), [id]),
  );

  const { result: duplicateContacts } = useRxData(
    "contacts",
    useCallback(
      (c) =>
        c.find({
          selector: {
            name: contact?.name,
            email: contact?.email,
            phone: contact?.phone,
          },
        }),
      [contact],
    ),
    { hold: !contact },
  );

  const { result: duplicateNames } = useRxData(
    "contacts",
    useCallback(
      (c) =>
        c.find({
          selector: {
            name: contact?.name,
          },
        }),
      [contact],
    ),
    { hold: !contact },
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

  const { result: events, isFetching: isFetchingEvents } = useRxData(
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
    isFetching: isFetchingCoupons,
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

  const mergeDuplicates = async () => {
    if (!ticketsCollection || !couponsCollection) {
      console.error("Tickets collection not found");
      return;
    }
    if (!duplicateContacts) {
      console.error("Duplicate contacts not found");
      return;
    }
    if (!contact) {
      console.error("Contact not found");
      return;
    }
    const toDelete = duplicateContacts.filter((c) => c.id !== contact.id);
    // Get all of the uses of all of the dulpicates
    const guestMentions = await ticketsCollection
      .find({
        selector: { guest_id: { $in: duplicateContacts.map((c) => c.id) } },
      })
      .exec();
    const billingMentions = await ticketsCollection
      .find({
        selector: { billing_id: { $in: duplicateContacts.map((c) => c.id) } },
      })
      .exec();
    const couponMentions = await couponsCollection
      .find({
        selector: { contact_id: { $in: duplicateContacts.map((c) => c.id) } },
      })
      .exec();
    // Update all of the uses to the current contact
    const guestPromises = guestMentions.map((t) =>
      t.incrementalPatch({ guest_id: contact.id }),
    );
    const billingPromises = billingMentions.map((t) =>
      t.incrementalPatch({ billing_id: contact.id }),
    );
    const couponPromises = couponMentions.map((c) =>
      c.incrementalPatch({ contact_id: contact.id }),
    );
    await Promise.all([
      ...guestPromises,
      ...billingPromises,
      ...couponPromises,
    ]);
    // remove the old contact
    await contactsCollection?.bulkRemove(toDelete.map((c) => c.id));
    toast.success("Kontakty boli spojené");
  };

  if (!isFetchingContact && !contact) {
    return <NoResults text="Kontakt neexistuje" />;
  }

  const deleteButton = (
    <Button
      variant="destructive"
      className="mt-4 self-end"
      type="button"
      disabled={!!tickets.length}
    >
      Vymazať kontakt
    </Button>
  );

  return (
    <div className="flex flex-col overflow-y-auto p-1">
      <h1 className="p-2 text-2xl font-bold tracking-wider">
        {contact?.name || <InlineLoading />}
      </h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <InstantTextField
          defaultValue={contact?.name || ""}
          updateValue={async (v) =>
            (await contact?.patch({ name: v }))?.name || ""
          }
          type="text"
          label="Meno"
          trim
          vertical
          validate={async (v) => (v ? null : "Meno je povinné")}
          baseClassName="grow"
        />
        <InstantTextField
          defaultValue={contact?.email || ""}
          updateValue={async (v) =>
            (await contact?.patch({ email: v }))?.email || ""
          }
          baseClassName="grow"
          type="email"
          label="Email"
          vertical
          trim
          placeholder="email@príklad.com"
          validate={async (value) => {
            const r = zString().email("Zadajte platný email").safeParse(value);
            return r.success ? null : r.error.message;
          }}
        />
        <InstantTextField
          defaultValue={contact?.phone || ""}
          // updateValue={(v) => updateContactField("phone", v)}
          updateValue={async (v) =>
            (await contact?.patch({ phone: v }))?.phone || ""
          }
          baseClassName="grow"
          type="text"
          label="Telefón"
          vertical
          trim
          placeholder="+421 *** *** ***"
        />
      </div>
      {duplicateContacts && duplicateContacts.length > 1 ? (
        <Alert variant={"destructive"} className="mt-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>
            Máte viac ako jeden kontakt s rovnakými údajmi.
          </AlertTitle>
          <AlertDescription className="pe-20">
            Pretože máte viacero kontaktov s rovnakými údajmi, odporúčame ich
            spojiť do jedného. Všetky lístky a poukazy patriace ostatným sa
            priradia ku tomuto.
          </AlertDescription>
          <AlertAction type="button" onClick={() => mergeDuplicates()}>
            Spojiť
          </AlertAction>
        </Alert>
      ) : (
        duplicateNames &&
        duplicateNames.length > 1 && (
          <Alert variant={"warning"} className="mt-6">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>
              Máte viac ako jeden kontakt s rovnakým menom.
            </AlertTitle>
            <AlertDescription className="pe-20">
              Ak ide o tú istú osobu, odporúčame zosynchronizovať údaje pri
              všetkých kontaktoch. Následne sa vám ukáže možnosť kontakty spojiť
              do jedného. Ak nechcete aby sa toto upozornenie zobrazovalo,
              zmeňte mierne meno, napríklad pridaním medzery medzi meno a
              priezvisko.
            </AlertDescription>

            <AlertAction asChild>
              <Button variant="ghost">
                <Link href={`/dashboard/contacts?query=${contact?.name}`}>
                  Zobraziť
                </Link>
              </Button>
            </AlertAction>
          </Alert>
        )
      )}

      <Tabs defaultValue="tickets" className="pt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">Lístky</TabsTrigger>
          <TabsTrigger value="coupons">Poukazy</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
          {isFetchingEvents ? (
            <Loading text="Načítavam lístky..." />
          ) : groupedTickets.length === 0 ? (
            <NoResults text="Tento kontakt nie je použitý pri žiadnom lístku" />
          ) : (
            <div className="flex flex-col gap-4">
              {groupedTickets.map((event) => (
                <EventDetail
                  key={event.event.id}
                  {...event}
                  editable={false}
                  hideCancelled={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="coupons">
          {isFetchingCoupons ? (
            <Loading text="Načítavam poukazy..." />
          ) : coupons.length === 0 ? (
            <NoResults text="K tomuto kontktu nie je priradený žiaden poukaz">
              <NewCouponButton contactId={contact?.id} />
            </NoResults>
          ) : (
            <div className="flex flex-col gap-4">
              <Table className="">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">Kód</TableHead>
                    <TableHead className="text-center">Kontakt</TableHead>
                    <TableHead className="text-end">Suma</TableHead>
                    <TableHead className="text-end">
                      Platí do:{" "}
                      <span className="text-xs font-light text-gray-500">
                        (vrátane)
                      </span>
                    </TableHead>
                    <TableHead className="text-center">Stav</TableHead>
                    <TableHead className="text-end">Poznámka</TableHead>
                    <TableHead className="whitespace-nowrap text-end">
                      Použité pri
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-end">
                      Vytvorené z
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <CouponRow
                      key={coupon.id}
                      coupon={coupon}
                      contact={contact || undefined}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
      {tickets.length ? (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger className="cursor-not-allowed self-end">
              {deleteButton}
            </TooltipTrigger>
            <TooltipContent side="left" align="end">
              Nemôžete vymazať kontakt ku ktorému sú priradené lístky
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : coupons.length ? (
        <ConfirmButton
          title="POZOR: Kontakt sa využíva pri poukazoch"
          description={
            <>
              Naozaj chcete vymazať tento kontakt? Táto akcia je nezvratná a
              všetky údaje budú stratené. Poukazy, pri ktorých je tento kontakt
              použitý, sa nevymažú, ale stratia informáciu o vlastníkovi.
            </>
          }
          variant={"destructive"}
          onConfirm={() => {
            contact?.remove();
            router.back();
          }}
        >
          {deleteButton}
        </ConfirmButton>
      ) : (
        <ConfirmButton
          title="Naozaj chcete vymazať tento kontakt?"
          description="Táto akcia je nezvratná a všetky údaje budú stratené."
          variant={"destructive"}
          onConfirm={() => {
            contact?.remove();
            router.back();
          }}
        >
          {deleteButton}
        </ConfirmButton>
      )}
    </div>
  );
}
