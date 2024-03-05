"use client";

import { useRxCollection, useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import InlineLoading from "@/utils/components/InlineLoading";
import {
  InstantSwitchField,
  InstantTextAreaField,
  InstantTextField,
} from "@/utils/forms/InstantFields";
import { useBrowserUser } from "@/utils/supabase/browser";
import {
  EllipsisHorizontalIcon,
  LockClosedIcon,
  LockOpenIcon,
  RocketLaunchIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Checkbox, Dropdown, Table, Tooltip } from "flowbite-react";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { HiChevronDown, HiTrash } from "react-icons/hi2";
import { LiaUnlinkSolid } from "react-icons/lia";
import { toast } from "react-toastify";
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
import {
  EventWithTickets,
  bulkUpsertContacts,
  updateTicketFields,
} from "./serverActions";

const ticketStatuses = ["rezervované", "zaplatené", "zrušené"];

function LinkUnlinkContact({
  groupSize,
  ticket,
  type,
}: {
  groupSize: number;
  ticket: EventWithTickets["tickets"][0];
  type: "guest_id" | "billing_id";
}) {
  const {
    events: { contacts, refresh },
    contact,
  } = useStoreContext((state) => ({
    ...state,
    contact: state.events.contacts.find((c) => c.id == ticket[type])!,
  }));
  if (contact.usage_count < 2) return null;
  return (
    <div className="inline-flex">
      {contact.usage_count > 1 && (groupSize > 1 || type === "guest_id") && (
        <div
          className={`inline-block p-1 ${
            type === "guest_id" ? "invisible group-hover:visible" : ""
          }`}
        >
          <Tooltip
            content={`Tento kontakt sa používa na ${
              contact.usage_count - 1
            } iných miestach. Kliknutím sem ${
              type === "guest_id"
                ? "zrušíte tento link a umožníte zmeny iba na tomto mieste."
                : "oddelíte jeden lístok z tejto skupiny."
            }`}
          >
            <button
              onClick={async () => {
                // TODO: Implement transaction
                const toastId = toast.loading("Vytváram kópiu kontaktu...");
                const { id, created_at, usage_count, ...contactData } =
                  contacts.find((c) => c.id === ticket[type])!;
                let name = contactData.name + ` (kópia ${1})`;
                for (let i = 2; true; i++) {
                  if (!contacts.find((c) => c.name === name)) break;
                  name = contactData.name + ` (kópia ${i})`;
                }
                const r = await bulkUpsertContacts([{ ...contactData, name }]);
                if (r.error) {
                  toast.update(toastId, {
                    render: r.error.message,
                    type: "error",
                    isLoading: false,
                    closeButton: true,
                  });
                  return;
                }
                const r2 = await updateTicketFields({
                  id: ticket.id,
                  billing_id:
                    type === "billing_id" ? r.data[0].id : ticket.billing_id,
                  guest_id:
                    type === "guest_id" || ticket.guest_id === ticket.billing_id
                      ? r.data[0].id
                      : ticket.guest_id,
                });
                if (r2.error) {
                  toast.update(toastId, {
                    render: r2.error.message,
                    type: "error",
                    isLoading: false,
                    closeButton: true,
                  });
                  return;
                }
                await refresh();
                toast.update(toastId, {
                  render: "Kontakt oddelený",
                  type: "success",
                  isLoading: false,
                  autoClose: 1500,
                });
              }}
            >
              <LiaUnlinkSolid
                className={`inline h-4 w-4 hover:scale-105 hover:text-red-500 active:scale-110 active:text-red-700`}
              />
            </button>
          </Tooltip>
        </div>
      )}
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
    () => selectedTickets.includes(ticket),
    [selectedTickets, ticket],
  );
  const isHighlighted = useMemo(
    () => highlightedTickets?.includes(ticket),
    [highlightedTickets, ticket],
  );

  const ticketsCollection = useRxCollection("tickets");
  const couponsCollection = useRxCollection("coupons");

  //TODO: Create a nice hook for finOne with populate
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
        return contact?.patch({ name: value || "" });
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
        t.patch({ guest_id: existingContact.id }),
      );
      const billingPromises = billingMentions.map((t) =>
        t.patch({ billing_id: existingContact.id }),
      );
      const couponPromises = couponMentions.map((c) =>
        c.patch({ contact_id: existingContact.id }),
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
          ? isHighlighted === undefined
            ? "bg-white"
            : isHighlighted
              ? "bg-yellow-200"
              : "bg-gray-100"
          : isHighlighted !== undefined
            ? "bg-red-100"
            : isHighlighted
              ? "bg-orange-300"
              : "bg-red-50"
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
            ticket.patch({ type_id: e.target.value, price: ticketType?.price });
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
        <Table.Cell className="group border-x p-1" rowSpan={groupSize}>
          <div className="flex flex-col">
            <div className="flex">
              <InstantTextField
                defaultValue={billingContact?.name || ""}
                type="text"
                trim
                placeholder="Meno"
                className="grow"
                validate={async (value) =>
                  value == "" ? "Meno nesmie byť prázdne" : null
                }
                updateValue={(value) =>
                  updateContactField(billingContact, "name", value || "")
                }
              />{" "}
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
              placeholder="Telefón"
              updateValue={(value) =>
                updateContactField(billingContact, "phone", value || "")
              }
            />
            <InstantTextField
              defaultValue={billingContact?.email || ""}
              type="email"
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
            updateValue={(value) => ticket.patch({ arrived: value })}
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
              t.patch({ payment_status: e.target.value }),
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
          updateValue={(value) => ticket.patch({ note: value || undefined })}
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
          validate={async (value) =>
            yupNumber()
              .min(0)
              .validate(value)
              .then(() => null)
              .catch((err) => err.message)
          }
          updateValue={(value) =>
            ticket.patch({ price: value ? parseFloat(value) : undefined })
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

function TicketRows({
  event,
  cancelled,
  selectedTickets,
  toggleSelectedTicket,
  lockedArrived,
}: {
  event: EventsDocument;
  cancelled: boolean;
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
      .map((billing_id) =>
        allTickets.filter((t) => t.billing_id === billing_id),
      );
  }, [allTickets]);

  return (
    <React.Fragment key={event.id + (cancelled ? "-cancelled" : "")}>
      {allTickets ? (
        groupedTickets.map((tickets) => (
          <React.Fragment key={"spacing-" + tickets[0].billing_id}>
            <Table.Row
              key={"spacing-" + tickets[0].billing_id}
              className="h-1"
            ></Table.Row>
            {tickets.map((ticket) => (
              <TicketRow
                key={"ticket-" + ticket.id}
                ticket={ticket}
                eventTickets={allTickets}
                selectedTickets={selectedTickets}
                toggleSelectedTicket={toggleSelectedTicket}
                lockedArrived={lockedArrived}
              />
            ))}
          </React.Fragment>
        ))
      ) : (
        <InlineLoading />
      )}
      {!cancelled && (
        <Table.Row className="h-1">
          <Table.Cell className="p-1" colSpan={8} />
          <Table.Cell className="p-1 text-end font-bold tracking-wider text-black">
            <hr />
            {allTickets?.reduce((acc, t) => acc + t.price, 0) || (
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
  searchTerm,
}: {
  event: EventsDocument;
  searchTerm: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<TicketsDocument[]>([]);
  const [lockedArrived, setLockedArrived] = useState(false);
  const [showCancelledTickets, setShowCancelledTickets] = useState(false);

  const toggleSelectedTicket = (ticket: TicketsDocument) => {
    if (selectedTickets.includes(ticket)) {
      setSelectedTickets(selectedTickets.filter((t) => t !== ticket));
    } else {
      setSelectedTickets([...selectedTickets, ticket]);
    }
  };

  const { result: allServices } = useRxData(
    "services",
    useCallback((collection) => collection.find(), []),
  );

  const { result: allTickets, collection: ticketsCollection } = useRxData(
    "tickets",
    useCallback(
      (collection) => collection.find().where("event_id").eq(event.id),
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
    const all = searchTickets(searchTerm, {
      tickets: allTickets,
      contacts: allContacts,
    });
    return {
      highlightedTickets: all.filter((t) => t.payment_status != "zrušené"),
      highlightedCancelledTickets: all.filter(
        (t) => t.payment_status == "zrušené",
      ),
    };
  }, [searchTerm, allTickets, allContacts]);

  return (
    <li
      key={event.id}
      className={`flex flex-col rounded-lg transition-all first:mt-0 last:mb-0 ${
        isExpanded || searchTerm
          ? "my-6 !border-slate-300 bg-slate-100"
          : "my-2"
      }`}
    >
      <EventRow
        className={`transition-all ${
          isExpanded || searchTerm ? "!bg-slate-100" : ""
        }`}
        event={event}
        onClick={() => setIsExpanded(!isExpanded)}
        actionButton={(event) => (
          <NewTicketsButton eventId={event.id.toString()} />
        )}
      />
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded || searchTerm
            ? "mb-2 grid-rows-[1fr] rounded-b-xl p-1 opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="flex items-end justify-end gap-2 overflow-y-hidden">
          <EditEventButton eventId={event.id.toString()} />
          <button
            type="button"
            // onClick={() =>
            //   optimisticUpdate({
            //     value: { id: event.id, is_public: !event.is_public },
            //     localUpdate: setPartialEvent,
            //     databaseUpdate: updateEvent,
            //     localRevert: () => setPartialEvent(event),
            //     loadingMessage: "Mením status...",
            //     successMessage: "Status zmenený",
            //     hideToast: true,
            //   })
            // }
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
              // optimisticUpdate({
              //   confirmation: "Naozaj chcete vymazať túto udalosť?",
              //   value: {},
              //   localUpdate: () => removeEvent(event.id),
              //   databaseUpdate: () => deleteEvent(event.id),
              //   localRevert: () => addEvent(event),
              //   loadingMessage: "Vymazávam...",
              //   successMessage: "Udalosť vymazaná",
              // });
            }}
          >
            Vymazať udalosť
            <TrashIcon className="h-4 w-4"></TrashIcon>
          </button>
        </div>
      </div>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded || searchTerm
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
                {highlightedTickets.length > 0 ||
                  (highlightedCancelledTickets.length > 0 && (
                    <span>
                      <span className="font-semibold">
                        {highlightedTickets.length +
                          highlightedCancelledTickets.length}{" "}
                      </span>
                      nájdených lítkov
                    </span>
                  ))}
                {highlightedCancelledTickets.length > 0 && (
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
              <MoveTicketsToDifferentEventModal event={event} />
              <ConvertToCouponModal event={event} />
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
                  // optimisticUpdate({
                  //   confirmation: `POZOR! Táto akcia je nevratná, stratíte všetky údaje. Naozaj chcete vymazať označené lístky (${selectedTickets.length})? Zvážte iba zmenu statusu na zrušené.`,
                  //   value: selectedTickets.map((t) => t.id),
                  //   localUpdate: () =>
                  //     removeTickets(selectedTickets.map((t) => t.id)),
                  //   databaseUpdate: () =>
                  //     deleteTickets(selectedTickets.map((t) => t.id)),
                  //   localRevert: () => addTickets(event.id, selectedTickets),
                  //   loadingMessage: "Vymazávam...",
                  //   successMessage: "Lístky vymazané",
                  // });
                }}
              >
                Vymazať
              </button>
            </div>
            {tickets?.length ? (
              <div className="w-full overflow-x-auto">
                <Table className="w-full">
                  <Table.Head>
                    <Table.HeadCell className="p-1 px-2">
                      <Checkbox
                        className="me-2"
                        checked={tickets.every((t) =>
                          selectedTickets.includes(t),
                        )}
                        onChange={() => {
                          const checked = !tickets.every((t) =>
                            selectedTickets.includes(t),
                          );
                          const ticketsToToggle = tickets.filter((t) =>
                            checked ? !selectedTickets.includes(t) : true,
                          );
                          ticketsToToggle.forEach((t) =>
                            toggleSelectedTicket(t),
                          );
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
                      <TicketRows
                        event={event}
                        cancelled={false}
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
                          highlightedCancelledTickets.length) && (
                          <TicketRows
                            event={event}
                            cancelled={true}
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

  const { result: allServices } = useRxData(
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
  );

  const { result: allEvents } = useRxData(
    "events",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            service_id: {
              $in: allServices?.map((s) => s.id) || [],
            },
          },
          sort: [{ date: "desc" }],
        }),
      [allServices],
    ),
  );

  const { result: allTickets } = useRxData(
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
  );

  const { result: allContacts } = useRxData(
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
  );

  const highlightedTickets = useMemo(
    () =>
      searchTickets(searchTerm, {
        tickets: allTickets,
        contacts: allContacts,
      }),
    [allContacts, allTickets, searchTerm],
  );

  const events = useMemo(
    () =>
      allEvents?.filter((e) =>
        highlightedTickets.some((t) => t.event_id === e.id),
      ) || [],
    [allEvents, highlightedTickets],
  );

  return (
    <>
      <Header
        title="Udalosti"
        search={{
          search: (query) => setSearchTerm(query),
          searchTerm,
          results: highlightedTickets.length,
        }}
        actionButton={
          allServices && allServices.length > 0 && <EditEventButton />
        }
      />
      {events.length > 0 ? (
        <ol
          role="list"
          className={`w-auto divide-gray-400 rounded-xl border border-gray-200 p-2`}
        >
          {events.map((event) => (
            <EventDetail key={event.id} event={event} searchTerm={searchTerm} />
          ))}
        </ol>
      ) : allServices?.length ? (
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
      ) : (
        <div className="flex flex-col items-center p-10">
          <RocketLaunchIcon className="w-12 text-gray-400" />
          <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
            Vytvorte si svoje prvé predstavenie
          </p>
          <div className="rounded-2xl border border-gray-200 p-4 shadow-md">
            <ServiceForm onSubmit={() => {}} />
          </div>
        </div>
      )}
    </>
  );
}
