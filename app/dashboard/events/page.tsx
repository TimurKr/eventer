"use client";

import { useRxCollection, useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import InlineLoading from "@/utils/components/InlineLoading";
import Loading from "@/utils/components/loading";
import {
  InstantSwitchField,
  InstantTextAreaField,
  InstantTextField,
} from "@/utils/forms/InstantFields";
import { useBrowserUser } from "@/utils/supabase/browser";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import {
  EllipsisHorizontalIcon,
  LockClosedIcon,
  LockOpenIcon,
  RocketLaunchIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Checkbox, Dropdown, Table, Tooltip } from "flowbite-react";
import moment from "moment";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { HiChevronDown, HiTrash } from "react-icons/hi2";
import { LiaUnlinkSolid } from "react-icons/lia";
import { number as yupNumber, string as yupString } from "yup";
import Header from "../components/Header";
import ServiceForm from "../services/edit/form";
import EventRow from "./_components/EventRow";
import ConvertToCouponModal from "./_modals/ConvertToCouponModal";
import CouponRelationManager from "./_modals/CouponRelationManager";
import MoveTicketsToDifferentEventModal from "./_modals/MoveTicketsToDifferentEventModal";
import EditEventButton from "./edit-event/button";
import EditEventForm from "./edit-event/form";
import { searchTickets } from "./helpers";
import NewTicketsButton from "./new-tickets/button";
import { TicketsSorting } from "./utils";

const ticketStatuses = ["rezervované", "zaplatené", "zrušené"];

function LinkUnlinkContact({
  groupSize,
  ticket,
  type,
}: {
  groupSize: number;
  ticket: TicketsDocument;
  type: "guest_id" | "billing_id";
}) {
  // const {
  //   events: { contacts, refresh },
  //   contact,
  // } = useStoreContext((state) => ({
  //   ...state,
  //   contact: state.events.contacts.find((c) => c.id == ticket[type])!,
  // }));

  const { result: contact, collection: contactsCollection } = useRxData(
    "contacts",
    useCallback(
      (collection) => collection.findOne(ticket[type]),
      [ticket, type],
    ),
  );

  const { result: tickets } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            $or: [{ guest_id: ticket[type] }, { billing_id: ticket[type] }],
          },
        }),
      [ticket, type],
    ),
    { hold: !contact, initialResult: [] },
  );

  const usage_count = useMemo(() => {
    if (!contact || !tickets) return 0;
    let count = 0;
    tickets.forEach((t) => {
      if (t.guest_id === contact.id) count++;
      if (t.billing_id === contact.id) count++;
    });
    return count;
  }, [tickets, contact]);

  if (!contact || !contactsCollection || usage_count < 2) return null;
  if (usage_count < 2) return null;
  if (groupSize < 2 && type !== "guest_id") return null;
  return (
    <div className="inline-flex">
      <div
        className={`inline-block p-1 ${
          type === "guest_id" ? "invisible group-hover:visible" : ""
        }`}
      >
        <Tooltip
          content={`Tento kontakt sa používa na ${
            usage_count - 1
          } iných miestach. Kliknutím sem ${
            type === "guest_id"
              ? "zrušíte tento link a umožníte zmeny iba na tomto mieste."
              : "oddelíte jeden lístok z tejto skupiny."
          }`}
        >
          <button
            onClick={async () => {
              const {
                _data: {
                  id,
                  created_at,
                  _attachments,
                  _meta,
                  _deleted,
                  _rev,
                  ...contactData
                },
              } = contact;
              let name = contactData.name + ` (kópia ${1})`;
              for (let i = 2; true; i++) {
                if (
                  !(await contactsCollection
                    .findOne({
                      selector: { name: { $eq: name } },
                    })
                    .exec())
                )
                  break;
                name = contactData.name + ` (kópia ${i})`;
              }
              const newContact = await contactsCollection.insert({
                ...contactData,
                name,
                id: crypto.randomUUID(),
              });
              if (
                ticket.guest_id === ticket.billing_id &&
                type === "billing_id"
              ) {
                await ticket.incrementalPatch({
                  guest_id: newContact.id,
                  billing_id: newContact.id,
                });
              } else {
                await ticket.incrementalPatch({ [type]: newContact.id });
              }
            }}
          >
            <LiaUnlinkSolid
              className={`inline h-4 w-4 hover:scale-105 hover:text-red-500 active:scale-110 active:text-red-700`}
            />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  eventTickets,
  selectedTickets,
  toggleSelectedTicket,
  highlightedTickets,
  lockedArrived,
}: {
  ticket: TicketsDocument;
  eventTickets: TicketsDocument[];
  selectedTickets: TicketsDocument[];
  toggleSelectedTicket: (ticket: TicketsDocument) => void;
  highlightedTickets?: TicketsDocument[];
  lockedArrived: boolean;
}) {
  const indexInEvent = useMemo(
    () => eventTickets.findIndex((t) => t.id === ticket.id),
    [ticket.id, eventTickets],
  );
  const groupSize = useMemo(
    () => eventTickets.filter((t) => t.billing_id === ticket.billing_id).length,
    [ticket.billing_id, eventTickets],
  );
  const groupTickets = useMemo(
    () => eventTickets.filter((t) => t.billing_id === ticket.billing_id),
    [ticket.billing_id, eventTickets],
  );
  const indexInGroup = useMemo(
    () => groupTickets.indexOf(ticket),
    [groupTickets, ticket],
  );

  const isSelected = useMemo(
    () => !!selectedTickets.find((st) => st.id === ticket.id),
    [selectedTickets, ticket],
  );
  const isHighlighted = useMemo(
    () => !!highlightedTickets?.find((ht) => ht.id === ticket.id),
    [highlightedTickets, ticket],
  );

  const ticketsCollection = useRxCollection("tickets");
  const couponsCollection = useRxCollection("coupons");

  //TODO: Create a nice hook for findOne with populate
  const { result: billingContact, collection: contactsCollection } = useRxData(
    "contacts",
    useCallback(
      (collection) => collection.findOne(ticket.billing_id),
      [ticket.billing_id],
    ),
  );
  const { result: guestContact } = useRxData(
    "contacts",
    useCallback(
      (collection) => collection.findOne(ticket.guest_id),
      [ticket.guest_id],
    ),
  );
  const { result: event } = useRxData(
    "events",
    useCallback(
      (collection) => collection.findOne(ticket.event_id),
      [ticket.event_id],
    ),
  );

  const { result: ticketTypes } = useRxData(
    "ticket_types",
    useCallback(
      (collection) =>
        collection.find({ selector: { service_id: event?.service_id } }),
      [event?.service_id],
    ),
  );
  const { result: ticketType } = useRxData(
    "ticket_types",
    useCallback(
      (collection) => collection.findOne(ticket.type_id),
      [ticket.type_id],
    ),
  );

  const updateContactField = useCallback(
    async (
      contact: ContactsDocument | null | undefined,
      field: "name" | "phone" | "email",
      value: string,
    ) => {
      if (!ticketsCollection || !contactsCollection || !couponsCollection) {
        console.error("Collections not found");
        return;
      }
      if (!contact) {
        console.error("No contact provided not found");
        return;
      }
      const existingContact = await contactsCollection
        .findOne({
          selector: {
            $and: [
              { name: { $eq: field === "name" ? value : contact?.name } },
              { phone: { $eq: field === "phone" ? value : contact?.phone } },
              { email: { $eq: field === "email" ? value : contact?.email } },
            ],
          },
        })
        .exec();
      if (!existingContact) {
        return await contact?.incrementalPatch({ [field]: value || "" });
      }
      if (
        !confirm("Takýto kontakt už v databáze máte, táto operácia ich spojí.")
      )
        return;
      // MERGING CONTACTS
      // remove all mentions of the old contact as guest, billing and coupon
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
        t.incrementalPatch({ guest_id: existingContact.id }),
      );
      const billingPromises = billingMentions.map((t) =>
        t.incrementalPatch({ billing_id: existingContact.id }),
      );
      const couponPromises = couponMentions.map((c) =>
        c.incrementalPatch({ contact_id: existingContact.id }),
      );
      await Promise.all([
        ...guestPromises,
        ...billingPromises,
        ...couponPromises,
      ]);
      // remove the old contact
      await contact?.remove();
    },
    [contactsCollection, couponsCollection, ticketsCollection],
  );

  return (
    <Table.Row
      key={ticket.id}
      id={"ticket-" + ticket.id}
      className={`${
        ticket.payment_status != "zrušené"
          ? isHighlighted
            ? "bg-yellow-200"
            : highlightedTickets
              ? "bg-gray-200"
              : "bg-white"
          : isHighlighted
            ? "bg-orange-300"
            : highlightedTickets
              ? "bg-red-50"
              : "bg-red-100"
      }`}
    >
      <Table.Cell
        className={`whitespace-nowrap p-0 pl-2 ${
          indexInGroup == 0 && "rounded-tl-md"
        } ${indexInGroup == groupSize - 1 && "rounded-bl-md"}`}
      >
        {ticket.payment_status != "zrušené" && (
          <Checkbox
            className="me-2"
            checked={isSelected}
            onChange={() => toggleSelectedTicket(ticket)}
          />
        )}
        {indexInEvent} - <span className="text-xs">{indexInGroup + 1}</span>
      </Table.Cell>
      <Table.Cell className="p-2 py-0">
        <select
          value={ticketType?.id}
          className={`rounded-md border-none px-2 py-0.5 text-xs font-semibold hover:cursor-pointer ${
            ticketType?.is_vip
              ? "bg-emerald-400 text-black"
              : "bg-gray-200 text-gray-600"
          }`}
          onChange={(e) => {
            if (
              !confirm(
                "Naozaj chcete zmeniť typ lístka? Zmení sa s ním aj cena.",
              )
            )
              return;
            ticket.incrementalPatch({
              type_id: e.target.value,
              price: ticketType?.price,
            });
          }}
        >
          {ticketTypes?.map((type) => (
            <option key={type.label} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className="group text-pretty border-l p-0">
        <InstantTextField
          defaultValue={guestContact?.name || ""}
          type="text"
          inline
          trim
          placeholder="Meno"
          validate={async (value) =>
            value == "" ? "Meno nesmie byť prázdne" : null
          }
          updateValue={(value) =>
            updateContactField(guestContact, "name", value || "")
          }
        />
        <InstantTextField
          defaultValue={guestContact?.phone || ""}
          type="text"
          inline
          trim
          placeholder="Telefón"
          updateValue={(value) =>
            updateContactField(guestContact, "phone", value || "")
          }
        />
        <div className="inline-block">
          <InstantTextField
            defaultValue={guestContact?.email || ""}
            type="email"
            inline
            trim
            placeholder="Email"
            validate={(value) =>
              yupString()
                .email("Zadajte platný email")
                .validate(value)
                .then(() => null)
                .catch((err) => err.message)
            }
            updateValue={(value) =>
              updateContactField(guestContact, "email", value || "")
            }
          />
          <LinkUnlinkContact
            groupSize={groupSize}
            ticket={ticket}
            type="guest_id"
          />
        </div>
      </Table.Cell>
      {indexInGroup == 0 && (
        <Table.Cell
          className={`group border-x p-1 ${
            ticket.payment_status != "zrušené"
              ? highlightedTickets
                ? "bg-gray-200"
                : "bg-white"
              : highlightedTickets
                ? "bg-red-50"
                : "bg-red-100"
          }`}
          rowSpan={groupSize}
        >
          <div className="flex flex-col">
            <div className="flex">
              <div className="grow">
                <InstantTextField
                  defaultValue={billingContact?.name || ""}
                  type="text"
                  trim
                  inline
                  placeholder="Meno"
                  className="grow"
                  validate={async (value) =>
                    value == "" ? "Meno nesmie byť prázdne" : null
                  }
                  updateValue={(value) =>
                    updateContactField(billingContact, "name", value || "")
                  }
                />
              </div>
              <LinkUnlinkContact
                groupSize={groupSize}
                ticket={ticket}
                type="billing_id"
              />
            </div>
            <InstantTextField
              defaultValue={billingContact?.phone || ""}
              type="text"
              trim
              inline
              placeholder="Telefón"
              updateValue={(value) =>
                updateContactField(billingContact, "phone", value || "")
              }
              className="font-mono"
            />
            <InstantTextField
              defaultValue={billingContact?.email || ""}
              type="email"
              trim
              inline
              placeholder="Email"
              validate={(value) =>
                yupString()
                  .email("Zadajte platný email")
                  .validate(value)
                  .then(() => null)
                  .catch((err) => err.message)
              }
              updateValue={(value) =>
                updateContactField(billingContact, "email", value || "")
              }
            />
          </div>
        </Table.Cell>
      )}
      <Table.Cell className="px-auto py-0">
        {ticket.payment_status != "zrušené" && (
          <InstantSwitchField
            disabled={lockedArrived}
            defaultValue={ticket.arrived!}
            updateValue={(value) => ticket.incrementalPatch({ arrived: value })}
          />
        )}
      </Table.Cell>
      <Table.Cell className="p-1 text-end">
        <select
          className={`border-1 rounded-md border-none px-2 py-0.5 text-xs font-semibold hover:cursor-pointer ${
            ticket.payment_status === "rezervované"
              ? "bg-yellow-300 text-yellow-600"
              : ticket.payment_status === "zaplatené"
                ? "bg-green-200 text-green-600"
                : ticket.payment_status === "zrušené"
                  ? "bg-red-200 text-gray-500"
                  : ""
          }`}
          onChange={async (e) => {
            let ticketsToUpdate = groupTickets.filter(
              (t) => t.payment_status == ticket.payment_status,
            );
            if (
              ticketsToUpdate.length > 1 &&
              !confirm(
                `Prajete si zmeniť status všetkých lístkov v tejto skupine s aktuálnym statusom ${ticket.payment_status}? (${ticketsToUpdate.length} lístkov)`,
              )
            )
              ticketsToUpdate = [ticket];

            ticketsToUpdate.forEach((t) =>
              t.incrementalPatch({ payment_status: e.target.value }),
            );
          }}
          value={ticket.payment_status}
        >
          {ticketStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className="relative w-36 overflow-clip p-1 text-end has-[:focus]:overflow-visible has-[:hover]:overflow-visible">
        <InstantTextAreaField
          autoexpand
          className="absolute inset-y-auto end-0 w-full -translate-y-1/2 transition-all duration-300 ease-in-out hover:w-64 focus:w-64"
          defaultValue={ticket.note || ""}
          placeholder="Poznámka"
          updateValue={(value) =>
            ticket.incrementalPatch({ note: value || undefined })
          }
        />
      </Table.Cell>
      <Table.Cell className="whitespace-nowrap px-1 py-0 text-end">
        <div className="flex flex-col justify-center py-1">
          <CouponRelationManager ticket={ticket} type={"redeemed"} />
          <CouponRelationManager ticket={ticket} type={"created"} />
        </div>
      </Table.Cell>
      <Table.Cell className="whitespace-nowrap px-1 py-0 text-end">
        <InstantTextField
          type="text"
          defaultValue={ticket.price.toString()}
          placeholder="Cena"
          inline={true}
          className="me-0"
          validate={async (value) => {
            return yupNumber()
              .required("Zadajte cenu")
              .validate(value || undefined)
              .then(() => null)
              .catch((err) => err.message);
          }}
          updateValue={(value) =>
            ticket.incrementalPatch({
              price: value ? parseFloat(value) : undefined,
            })
          }
        />{" "}
        €
      </Table.Cell>
      <Table.Cell
        className={`whitespace-nowrap p-1 ${
          indexInGroup == 0 && "rounded-tr-md"
        } ${indexInGroup == groupSize - 1 && "rounded-br-md"}`}
      >
        <Dropdown
          label=""
          dismissOnClick={false}
          renderTrigger={() => (
            <EllipsisHorizontalIcon className="h-5 w-5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:cursor-pointer hover:bg-gray-200" />
          )}
        >
          <Dropdown.Item
            className="text-red-500"
            icon={HiTrash}
            onClick={() => {
              if (
                !confirm(
                  "Naozaj chcete vymazať tento lístok? Zvážte iba zmenu statusu na zrušené.",
                )
              )
                return;
              ticket.remove();
            }}
          >
            Vymazať
          </Dropdown.Item>
        </Dropdown>
      </Table.Cell>
    </Table.Row>
  );
}

function TicketGroup({
  event,
  cancelled,
  highlightedTickets,
  selectedTickets,
  toggleSelectedTicket,
  lockedArrived,
}: {
  event: EventsDocument;
  cancelled: boolean;
  highlightedTickets?: TicketsDocument[];
  selectedTickets: TicketsDocument[];
  toggleSelectedTicket: (ticket: TicketsDocument) => void;
  lockedArrived: boolean;
}) {
  const { result: allTickets } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            event_id: { $eq: event.id },
            payment_status: cancelled ? { $eq: "zrušené" } : { $ne: "zrušené" },
          },
        }),
      [cancelled, event.id],
    ),
  );

  const groupedTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets
      .map((t) => t.billing_id)
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((billing_id) => ({
        billing_id,
        tickets: allTickets.filter((t) => t.billing_id === billing_id),
      }));
  }, [allTickets]);

  return (
    <React.Fragment key={event.id + (cancelled ? "-cancelled" : "")}>
      {allTickets ? (
        groupedTickets.map((group) => (
          <React.Fragment key={"spacing-" + group.billing_id}>
            <Table.Row
              key={"spacing-" + group.billing_id}
              className="h-1"
            ></Table.Row>
            {group.tickets.map((ticket) => (
              <TicketRow
                key={"ticket-" + ticket.id}
                ticket={ticket}
                eventTickets={allTickets}
                selectedTickets={selectedTickets}
                toggleSelectedTicket={toggleSelectedTicket}
                lockedArrived={lockedArrived}
                highlightedTickets={highlightedTickets}
              />
            ))}
          </React.Fragment>
        ))
      ) : (
        <Table.Row className="h-1">
          <Table.Cell className="p-1" colSpan={10}>
            <InlineLoading />
          </Table.Cell>
        </Table.Row>
      )}
      {!cancelled && (
        <Table.Row className="h-1">
          <Table.Cell className="p-1" colSpan={8} />
          <Table.Cell className="p-1 text-end font-bold tracking-wider text-black">
            <hr />
            {allTickets ? (
              allTickets.reduce((acc, t) => acc + t.price, 0)
            ) : (
              <InlineLoading />
            )}{" "}
            €
          </Table.Cell>
          <Table.Cell className="p-1" colSpan={1} />
        </Table.Row>
      )}
    </React.Fragment>
  );
}

function EventDetail({
  event,
  allHighlightedTickets,
}: {
  event: EventsDocument;
  allHighlightedTickets?: TicketsDocument[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<TicketsDocument[]>([]);
  const [lockedArrived, setLockedArrived] = useState(true);
  const [showCancelledTickets, setShowCancelledTickets] = useState(false);

  const toggleSelectedTicket = (
    tickets: TicketsDocument | TicketsDocument[],
  ) => {
    let newSelectedTickets = selectedTickets;
    if (!Array.isArray(tickets)) {
      tickets = [tickets];
    }
    tickets.forEach((ticket) => {
      if (newSelectedTickets.find((st) => st === ticket)) {
        newSelectedTickets = newSelectedTickets.filter(
          (t) => t.id !== ticket.id,
        );
      } else {
        newSelectedTickets = [...newSelectedTickets, ticket];
      }
    });
    setSelectedTickets(newSelectedTickets);
  };

  const { result: allServices } = useRxData(
    "services",
    useCallback((collection) => collection.find(), []),
  );

  const { result: allTickets, collection: ticketsCollection } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: { event_id: { $eq: event.id } },
          sort: TicketsSorting,
        }),
      [event.id],
    ),
  );

  const { tickets, cancelled_tickets } = useMemo(() => {
    const tickets =
      allTickets?.filter((t) => t.payment_status != "zrušené") || [];
    const cancelled_tickets =
      allTickets?.filter((t) => t.payment_status == "zrušené") || [];
    return { tickets, cancelled_tickets };
  }, [allTickets]);

  const { result: allContacts } = useRxData(
    "contacts",
    useCallback(
      (collection) =>
        collection
          .find()
          .where("id")
          .in(tickets.map((t) => t.billing_id)),
      [tickets],
    ),
  );

  const { highlightedTickets, highlightedCancelledTickets } = useMemo(() => {
    return {
      highlightedTickets: allHighlightedTickets?.filter(
        (t) => t.payment_status != "zrušené",
      ),
      highlightedCancelledTickets: allHighlightedTickets?.filter(
        (t) => t.payment_status == "zrušené",
      ),
    };
  }, [allHighlightedTickets]);

  const isShown =
    isExpanded ||
    highlightedTickets?.length ||
    highlightedCancelledTickets?.length;

  return (
    <li
      key={event.id}
      className={`flex flex-col rounded-lg transition-all first:mt-0 last:mb-0 ${
        isShown ? "my-6 !border-slate-300 bg-slate-100 shadow-lg" : "my-2"
      }`}
    >
      <EventRow
        className={`transition-all ${isShown ? "!bg-slate-100" : ""}`}
        event={event}
        onClick={() => setIsExpanded(!isExpanded)}
        actionButton={<NewTicketsButton eventId={event.id.toString()} />}
      />
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isShown
            ? "mb-2 grid-rows-[1fr] rounded-b-xl p-1 opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="flex items-end justify-end gap-2 overflow-y-hidden">
          <EditEventButton eventId={event.id.toString()} />
          <button
            type="button"
            onClick={() =>
              event.incrementalPatch({ is_public: !event.is_public })
            }
            className="me-auto flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
          >
            {event.is_public ? (
              <>
                <LockClosedIcon className="h-3 w-3"></LockClosedIcon>
                <span>Spraviť udalosť súkromnou</span>
              </>
            ) : (
              <>
                <LockOpenIcon className="h-3 w-3"></LockOpenIcon>
                <span>Zverejniť udalosť</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-red-500 px-2 py-1 text-sm text-red-500 hover:bg-red-50"
            onClick={() => {
              if (tickets?.length) {
                alert(
                  "Nemôžete vymazať udalosť, ktorá má predané lístky. Najprv vymažte lístky.",
                );
                return;
              }
              if (!confirm("Naozaj chcete vymazať túto udalosť?")) return;
              event.remove();
            }}
          >
            Vymazať udalosť
            <TrashIcon className="h-4 w-4"></TrashIcon>
          </button>
        </div>
      </div>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isShown
            ? "mb-2 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-y-hidden">
          <div className="flex items-center">
            <p className="ps-2 text-sm font-medium tracking-wider text-gray-700">
              Lístky
            </p>
            <div className="mx-4 h-px flex-grow bg-gray-300" />
          </div>
          <div className="p-2">
            <div className="flex items-center gap-2 pb-1">
              <div className="flex flex-col text-xs text-gray-500">
                {highlightedTickets && highlightedCancelledTickets && (
                  <span>
                    <span className="font-semibold">
                      {highlightedTickets.length +
                        highlightedCancelledTickets.length}{" "}
                    </span>
                    nájdených lítkov
                  </span>
                )}
                {highlightedCancelledTickets && (
                  <span>
                    z toho{" "}
                    <span className="font-semibold">
                      {highlightedCancelledTickets.length}{" "}
                    </span>
                    zrušených
                  </span>
                )}
              </div>
              <p className="ms-auto text-sm text-gray-600">
                (Označených: {selectedTickets.length})
              </p>
              <MoveTicketsToDifferentEventModal
                originalEvent={event}
                selectedTickets={selectedTickets}
              />
              <ConvertToCouponModal selectedTickets={selectedTickets} />
              <button
                className="rounded-md bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 active:bg-red-800"
                onClick={() => {
                  if (selectedTickets.length === 0) {
                    alert("Zvolte aspoň jeden lístok");
                    return;
                  }
                  if (
                    !confirm(
                      `POZOR! Táto akcia je nevratná, stratíte všetky údaje. Naozaj chcete vymazať označené lístky (${selectedTickets.length})? Zvážte iba zmenu statusu na zrušené.`,
                    )
                  )
                    return;
                  ticketsCollection?.bulkRemove(
                    selectedTickets.map((t) => t.id),
                  );
                }}
              >
                Vymazať
              </button>
            </div>
            {tickets?.length ? (
              <div className="w-full overflow-x-auto">
                <Table className="w-full">
                  <Table.Head className="!bg-white">
                    <Table.HeadCell className="p-1 px-2">
                      <Checkbox
                        className="me-2"
                        checked={tickets.every((t) =>
                          selectedTickets.find((st) => st.id === t.id),
                        )}
                        onChange={() => {
                          const checked = tickets.every((t) =>
                            selectedTickets.find((st) => st.id === t.id),
                          );
                          const ticketsToToggle = tickets.filter((t) =>
                            checked
                              ? true
                              : !selectedTickets.find((st) => st.id === t.id),
                          );
                          toggleSelectedTicket(ticketsToToggle);
                        }}
                      />
                      #
                    </Table.HeadCell>
                    <Table.HeadCell className="px-auto p-1">Typ</Table.HeadCell>
                    <Table.HeadCell className="p-1 text-center" colSpan={1}>
                      Hostia
                    </Table.HeadCell>
                    <Table.HeadCell className="p-1 text-center">
                      Platca
                    </Table.HeadCell>
                    <Table.HeadCell className="p-1 px-0">
                      <div className="item-center-justify-center flex gap-1">
                        <button
                          className="text-gray-500 hover:text-gray-600 active:text-gray-700"
                          onClick={() => setLockedArrived(!lockedArrived)}
                        >
                          {lockedArrived ? (
                            <LockClosedIcon className="h-3 w-3" />
                          ) : (
                            <LockOpenIcon className="h-3 w-3" />
                          )}
                        </button>
                        Dorazil
                      </div>
                    </Table.HeadCell>
                    <Table.HeadCell className="p-1 text-center">
                      Status
                    </Table.HeadCell>
                    <Table.HeadCell className="p-1 text-center">
                      Poznámka
                    </Table.HeadCell>
                    <Table.HeadCell className="p-1 text-end">
                      Poukaz
                    </Table.HeadCell>
                    <Table.HeadCell className="p-1 text-end">
                      Cena
                    </Table.HeadCell>
                    <Table.HeadCell className="p-1">
                      <span className="sr-only">Edit</span>
                    </Table.HeadCell>
                  </Table.Head>
                  <Table.Body>
                    {tickets.length > 0 && (
                      <TicketGroup
                        event={event}
                        cancelled={false}
                        highlightedTickets={highlightedTickets}
                        selectedTickets={selectedTickets}
                        toggleSelectedTicket={toggleSelectedTicket}
                        lockedArrived={lockedArrived}
                      />
                    )}
                    {cancelled_tickets.length > 0 && (
                      <>
                        <Table.Row className="text-center">
                          <Table.Cell className="p-1" colSpan={9}>
                            <button
                              className="flex w-full items-center justify-center hover:underline"
                              onClick={() =>
                                setShowCancelledTickets(!showCancelledTickets)
                              }
                            >
                              <HiChevronDown
                                className={`${
                                  showCancelledTickets
                                    ? "rotate-180 transform"
                                    : ""
                                } h-4 w-4 transition-transform duration-500 group-hover:text-gray-600`}
                              />
                              Zrušené lístky
                            </button>
                          </Table.Cell>
                        </Table.Row>
                        {(showCancelledTickets ||
                          highlightedCancelledTickets) && (
                          <TicketGroup
                            event={event}
                            cancelled={true}
                            highlightedTickets={highlightedCancelledTickets}
                            selectedTickets={selectedTickets}
                            toggleSelectedTicket={toggleSelectedTicket}
                            lockedArrived={lockedArrived}
                          />
                        )}
                      </>
                    )}
                  </Table.Body>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-center text-xs text-gray-500">
                  Žiadne lístky
                </p>
                <NewTicketsButton eventId={event.id.toString()} />
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function Page() {
  const q = useSearchParams().get("query");
  const [searchTerm, setSearchTerm] = useState(q || "");

  const user = useBrowserUser();

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
      searchTerm && allContacts && allTickets
        ? searchTickets(searchTerm, {
            tickets: allTickets,
            contacts: allContacts,
          })
        : undefined,
    [allContacts, allTickets, searchTerm],
  );

  const events = useMemo(
    () =>
      highlightedTickets
        ? allEvents.filter((e) =>
            highlightedTickets.some((t) => t.event_id === e.id),
          )
        : allEvents,
    [allEvents, highlightedTickets],
  );

  const { previousEvents, todayEvents, futureEvents } = useMemo(
    () => ({
      previousEvents: events.filter((e) =>
        moment(e.datetime).endOf("D").isBefore(moment()),
      ),
      todayEvents: events.filter((e) =>
        moment(e.datetime).isSame(moment(), "D"),
      ),
      futureEvents: events.filter((e) =>
        moment(e.datetime).startOf("D").isAfter(moment()),
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
          search: (query) => setSearchTerm(query),
          searchTerm,
          results: highlightedTickets?.length || 0,
        }}
        actionButton={allServices.length > 0 && <EditEventButton />}
      />
      {events.length > 0 ? (
        <ol
          role="list"
          className={`w-auto divide-gray-400 rounded-xl border border-gray-200 p-2`}
        >
          {futureEvents.map((event) => (
            <EventDetail
              key={event.id}
              event={event}
              allHighlightedTickets={highlightedTickets}
            />
          ))}
          {todayEvents.length > 0 && (
            <li>
              <div className="flex items-center m-6">
                <p className="font-medium text-cyan-600">Dnes</p>
                <div className="h-px bg-gray-200 mx-4 grow" />
              </div>
            </li>
          )}
          {todayEvents.map((event) => (
            <EventDetail
              key={event.id}
              event={event}
              allHighlightedTickets={highlightedTickets}
            />
          ))}
          {previousEvents.length > 0 && (
            <li>
              <div className="flex items-center m-6">
                <p className="font-medium text-sm text-gray-600">História</p>
                <div className="h-px bg-gray-200 mx-4 grow" />
              </div>
            </li>
          )}
          {previousEvents.map((event) => (
            <EventDetail
              key={event.id}
              event={event}
              allHighlightedTickets={highlightedTickets}
            />
          ))}
        </ol>
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
      ) : searchTerm ? (
        <div className="flex flex-col items-center p-10">
          <MagnifyingGlassIcon className="w-12 text-gray-400 animate-wiggle" />
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
