"use client";

import {
  InstantSwitchField,
  InstantTextAreaField,
  InstantTextField,
} from "@/utils/forms/FormElements";
import { optimisticUpdate } from "@/utils/misc";
import {
  EllipsisHorizontalIcon,
  LockClosedIcon,
  LockOpenIcon,
  RocketLaunchIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Checkbox, Dropdown, Table, Tooltip } from "flowbite-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { HiChevronDown, HiTrash } from "react-icons/hi2";
import { LiaUnlinkSolid } from "react-icons/lia";
import { toast } from "react-toastify";
import { number as yupNumber, string as yupString } from "yup";
import Header from "../components/Header";
import ServiceForm from "../services/edit/form";
import { useStoreContext } from "../store";
import EventRows from "./_components/EventRow";
import ConvertToCouponModal from "./_modals/ConvertToCouponModal";
import CouponRelationManager from "./_modals/CouponRelationManager";
import MoveTicketsToDifferentEventModal from "./_modals/MoveTicketsToDifferentEventModal";
import EditEventButton from "./edit-event/button";
import EditEventForm from "./edit-event/form";
import NewTicketsButton from "./new-tickets/button";
import {
  EventWithTickets,
  bulkUpsertContacts,
  deleteEvent,
  deleteTickets,
  mergeContacts,
  updateContactFields,
  updateEvent,
  updateTicketFields,
  updateTicketPaymentStatus,
} from "./serverActions";
import { Events } from "./store/helpers";

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
  tickets,
}: {
  ticket: EventWithTickets["tickets"][0];
  tickets: EventWithTickets["tickets"];
}) {
  const {
    highlightedTicketIds,
    selectedTicketIds,
    setPartialTicket,
    search,
    setPartialContact,
    setTicketsStatus,
    removeTickets,
    addTickets,
    toggleSelectedTicket,
    event,
    contacts,
    refresh,
    ticketTypes,
  } = useStoreContext((state) => ({
    ...state.events,
    event: state.events.allEvents.find((e) => e.id == ticket.event_id)!,
    ticketTypes: state.services.allServices.find(
      (s) =>
        s.id ===
        state.events.allEvents.find((e) => e.id == ticket.event_id)!.service_id,
    )!.ticket_types,
  }));

  const indexInEvent = tickets.findIndex((t) => t === ticket);
  const groupSize = tickets.filter(
    (t) => t.billing_id === ticket.billing_id,
  ).length;
  const indexInGroup = tickets
    .filter((t) => t.billing_id === ticket.billing_id)
    .findIndex((t) => t === ticket);

  const billingContact = contacts.find((c) => c.id === ticket.billing_id)!;
  const guestContact = contacts.find((c) => c.id === ticket.guest_id)!;

  return (
    <Table.Row
      key={ticket.id}
      id={"ticket-" + ticket.id}
      className={`${
        ticket.payment_status != "zrušené"
          ? highlightedTicketIds.length > 0
            ? highlightedTicketIds.includes(ticket.id)
              ? "bg-yellow-200"
              : "bg-gray-100"
            : "bg-white"
          : highlightedTicketIds.length > 0
            ? highlightedTicketIds.includes(ticket.id)
              ? "bg-orange-300"
              : "bg-red-50"
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
            checked={selectedTicketIds?.includes(ticket.id)}
            onChange={() => toggleSelectedTicket(ticket.id)}
          />
        )}
        {indexInEvent} - <span className="text-xs">{indexInGroup + 1}</span>
      </Table.Cell>
      <Table.Cell className="p-2 py-0">
        <select
          className={`rounded-md border-none px-2 py-0.5 text-xs font-semibold hover:cursor-pointer ${
            ticket.type.is_vip
              ? "bg-emerald-400 text-black"
              : "bg-gray-200 text-gray-600"
          }`}
          onChange={(e) =>
            optimisticUpdate({
              value: {},
              localUpdate: () =>
                setPartialTicket({
                  id: ticket.id,
                  type_id: parseInt(e.target.value),
                  type: ticketTypes.find(
                    (t) => t.id == parseInt(e.target.value),
                  )!,
                  price: ticketTypes.find(
                    (t) => t.id == parseInt(e.target.value),
                  )!.price,
                }),
              databaseUpdate: () =>
                updateTicketFields({
                  id: ticket.id,
                  type_id: parseInt(e.target.value),
                  price: ticketTypes.find(
                    (t) => t.id == parseInt(e.target.value),
                  )!.price,
                }),
              localRevert: () =>
                setPartialTicket({
                  id: ticket.id,
                  type: ticket.type, //TODO: test if this is oukej, because ticket.type is changed by the time this is called
                  price: ticket.price,
                }),
              confirmation: `Naozaj chcete zmeniť typ lístka? Zmení sa ním aj cena.`,
              successMessage: "Typ lístka zmenený",
            })
          }
          value={ticket.type.id}
        >
          {ticketTypes.map((type) => (
            <option key={type.label} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className="group text-pretty border-l p-0">
        <InstantTextField
          defaultValue={guestContact.name}
          type="text"
          inline
          trim
          placeholder="Meno"
          validate={async (value) =>
            value == "" ? "Meno nesmie byť prázdne" : null
          }
          updateDatabase={async (value) => {
            const r = await updateContactFields({
              id: ticket.guest_id,
              name: value || "",
            });
            if (!r.error) return r;
            if (
              !confirm(
                "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
              )
            )
              return { terminate: true };
            const r2 = await mergeContacts(guestContact, {
              name: value || "",
            });
            if (!r2.error) refresh();
            return r2;
          }}
          setLocalValue={(value) => {
            setPartialContact({ id: ticket.guest_id, name: value || "" });
            search({});
          }}
        />
        <InstantTextField
          defaultValue={guestContact.phone}
          type="text"
          inline
          trim
          placeholder="Telefón"
          updateDatabase={async (value) => {
            const r = await updateContactFields({
              id: ticket.guest_id,
              phone: value || "",
            });
            if (!r.error || r.status != 409) return r;
            if (
              !confirm(
                "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
              )
            )
              return { terminate: true };
            const r2 = await mergeContacts(guestContact, {
              phone: value || "",
            });
            if (!r2.error) refresh();
            return r2;
          }}
          setLocalValue={(value) =>
            setPartialContact({
              id: ticket.guest_id,
              phone: value || "",
            })
          }
        />
        <div className="inline-block">
          <InstantTextField
            defaultValue={guestContact.email}
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
            updateDatabase={async (value) => {
              const r = await updateContactFields({
                id: ticket.guest_id,
                email: value || "",
              });
              if (!r.error || r.status != 409) return r;
              if (
                !confirm(
                  "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
                )
              )
                return { terminate: true };
              const r2 = await mergeContacts(guestContact, {
                email: value || "",
              });
              if (!r2.error) refresh();
              return r2;
            }}
            setLocalValue={(value) =>
              setPartialContact({
                id: ticket.guest_id,
                email: value || "",
              })
            }
          />
          <LinkUnlinkContact
            // identicalContactFound={
            //   allContacts
            //     .filter((c, i, a) => a.findIndex((c2) => c.id == c2.id) === i)
            //     .filter((c) => contactsEqual(c, ticket.guest!)).length
            // }
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
                defaultValue={billingContact.name}
                type="text"
                trim
                placeholder="Meno"
                className="grow"
                validate={async (value) =>
                  value == "" ? "Meno nesmie byť prázdne" : null
                }
                updateDatabase={async (value) => {
                  const r = await updateContactFields({
                    id: ticket.billing_id,
                    name: value || "",
                  });
                  if (!r.error || r.status != 409) return r;
                  if (
                    !confirm(
                      "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
                    )
                  )
                    return { terminate: true };
                  const r2 = await mergeContacts(billingContact, {
                    name: value || "",
                  });
                  if (!r2.error) refresh();
                  return r2;
                }}
                setLocalValue={(value) =>
                  setPartialContact({
                    id: ticket.billing_id,
                    name: value || "",
                  })
                }
              />{" "}
              <LinkUnlinkContact
                groupSize={groupSize}
                ticket={ticket}
                type="billing_id"
              />
            </div>
            <InstantTextField
              defaultValue={billingContact.phone}
              type="text"
              trim
              placeholder="Telefón"
              updateDatabase={async (value) => {
                const r = await updateContactFields({
                  id: ticket.billing_id,
                  phone: value || "",
                });
                if (!r.error || r.status != 409) return r;
                if (
                  !confirm(
                    "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
                  )
                )
                  return { terminate: true };
                const r2 = await mergeContacts(billingContact, {
                  phone: value || "",
                });
                if (!r2.error) refresh();
                return r2;
              }}
              setLocalValue={(value) =>
                setPartialContact({
                  id: ticket.billing_id,
                  phone: value || "",
                })
              }
            />
            <InstantTextField
              defaultValue={billingContact.email}
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
              updateDatabase={async (value) => {
                const r = await updateContactFields({
                  id: ticket.billing_id,
                  email: value || "",
                });
                if (!r.error || r.status != 409) return r;
                if (
                  !confirm(
                    "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
                  )
                )
                  return { terminate: true };
                const r2 = await mergeContacts(billingContact, {
                  email: value || "",
                });
                if (!r2.error) refresh();
                return r2;
              }}
              setLocalValue={(value) =>
                setPartialContact({
                  id: ticket.billing_id,
                  email: value || "",
                })
              }
            />
          </div>
        </Table.Cell>
      )}
      <Table.Cell className="px-auto py-0">
        {ticket.payment_status != "zrušené" && (
          <InstantSwitchField
            disabled={event.lockedArrived}
            defaultValue={ticket.arrived}
            updateDatabase={(value) =>
              updateTicketFields({ id: ticket.id, arrived: value })
            }
            setLocalValue={(value) =>
              setPartialTicket({ id: ticket.id, arrived: value })
            }
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
            let IDs = tickets
              .filter(
                (t) =>
                  t.billing_id == ticket.billing_id &&
                  t.payment_status == ticket.payment_status,
              )
              .map((t) => t.id);
            if (
              IDs.length > 1 &&
              !confirm(
                `Prajete si zmeniť status všetkých lístkov v tejto skupine s aktuálnym statusom ${ticket.payment_status}? (${IDs.length} lístkov)`,
              )
            )
              IDs = [ticket.id];
            optimisticUpdate({
              value: {},
              localUpdate: () => setTicketsStatus(IDs, e.target.value),
              databaseUpdate: () =>
                updateTicketPaymentStatus(IDs, e.target.value),
              localRevert: () => setTicketsStatus(IDs, ticket.payment_status),
              successMessage: "Status lístkov zmenený",
            });
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
          defaultValue={ticket.note}
          placeholder="Poznámka"
          setLocalValue={(value) =>
            setPartialTicket({ id: ticket.id, note: value })
          }
          updateDatabase={(value) =>
            updateTicketFields({
              id: ticket.id,
              note: value,
            })
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
          validate={async (value) =>
            yupNumber()
              .min(0)
              .validate(value)
              .then(() => null)
              .catch((err) => err.message)
          }
          setLocalValue={(value) =>
            setPartialTicket({
              id: ticket.id,
              price: value ? parseFloat(value) : undefined,
            })
          }
          updateDatabase={(value) =>
            updateTicketFields({
              id: ticket.id,
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
            onClick={() =>
              optimisticUpdate({
                confirmation:
                  "Naozaj chcete vymazať tento lístok? Zvážte iba zmenu statusu na zrušené.",
                value: {},
                localUpdate: () => removeTickets([ticket.id]),
                databaseUpdate: () => deleteTickets([ticket.id]),
                localRevert: () => addTickets(event.id, [ticket]),
                loadingMessage: "Vymazávam...",
                successMessage: "Lístok vymazaný",
              })
            }
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
}: {
  event: Events;
  cancelled: boolean;
}) {
  const tickets = cancelled ? event.cancelled_tickets : event.tickets;

  return (
    <React.Fragment key={event.id + (cancelled ? "-cancelled" : "")}>
      {tickets
        .map((t) => t.billing_id)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((billing_id) => (
          <React.Fragment
            key={event.id + "-" + billing_id + (cancelled ? "-cancelled" : "")}
          >
            <Table.Row
              key={"spacing-" + billing_id}
              className="h-1"
            ></Table.Row>
            {tickets
              .filter((t) => t.billing_id == billing_id)
              .map((ticket) => (
                <TicketRow
                  key={"ticket-" + ticket.id}
                  ticket={ticket}
                  tickets={tickets}
                />
              ))}
          </React.Fragment>
        ))}
      {tickets[0].payment_status != "zrušené" && (
        <Table.Row className="h-1">
          <Table.Cell className="p-1" colSpan={8} />
          <Table.Cell className="p-1 text-end font-bold tracking-wider text-black">
            <hr />
            {tickets.reduce((acc, t) => acc + t.price, 0)} €
          </Table.Cell>
          <Table.Cell className="p-1" colSpan={1} />
        </Table.Row>
      )}
    </React.Fragment>
  );
}

function EventDetail({ event }: { event: Events }) {
  const {
    services: { service, allServices },
    events: {
      searchTerm,
      removeEvent,
      addEvent,
      setPartialEvent,
      removeTickets,
      addTickets,
      toggleSelectedTicket,
      toggleEventIsExpanded,
      toggleEventLockedArrived,
      toggleEventShowCancelledTickets,
      selectedTickets,
      higlightedTickets,
      highlightedCancelledTickets,
    },
  } = useStoreContext((state) => {
    return {
      services: {
        service: state.services.allServices.find(
          (s) => s.id == event.service_id,
        )!,
        allServices: state.services.allServices,
      },
      events: {
        ...state.events,
        selectedTickets: state.events.allEvents
          .find((e) => e.id === event.id)!
          .tickets.filter((t) => state.events.selectedTicketIds.includes(t.id)),
        higlightedTickets: event.tickets.filter((t) =>
          state.events.highlightedTicketIds.includes(t.id),
        ).length,
        highlightedCancelledTickets: event.cancelled_tickets.filter((t) =>
          state.events.highlightedTicketIds.includes(t.id),
        ).length,
      },
    };
  });

  return (
    <li
      key={event.id}
      className={`flex flex-col rounded-lg transition-all first:mt-0 last:mb-0 ${
        event.isExpanded || searchTerm
          ? "my-6 !border-slate-300 bg-slate-100"
          : "my-2"
      }`}
    >
      <EventRows
        className={`transition-all ${
          event.isExpanded || searchTerm ? "!bg-slate-100" : ""
        }`}
        events={[event]}
        services={allServices}
        onClick={(event) => toggleEventIsExpanded(event.id)}
        actionButton={(event) => (
          <NewTicketsButton eventId={event.id.toString()} />
        )}
      />
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          event.isExpanded || searchTerm
            ? "mb-2 grid-rows-[1fr] rounded-b-xl p-1 opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="flex items-end justify-end gap-2 overflow-y-hidden">
          <EditEventButton eventId={event.id.toString()} />
          <button
            type="button"
            onClick={() =>
              optimisticUpdate({
                value: { id: event.id, is_public: !event.is_public },
                localUpdate: setPartialEvent,
                databaseUpdate: updateEvent,
                localRevert: () => setPartialEvent(event),
                loadingMessage: "Mením status...",
                successMessage: "Status zmenený",
                hideToast: true,
              })
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
              if (
                event.tickets.length > 0 ||
                event.cancelled_tickets.length > 0
              ) {
                alert(
                  "Nemôžete vymazať udalosť, ktorá má predané lístky. Najprv vymažte lístky.",
                );
                return;
              }
              optimisticUpdate({
                confirmation: "Naozaj chcete vymazať túto udalosť?",
                value: {},
                localUpdate: () => removeEvent(event.id),
                databaseUpdate: () => deleteEvent(event.id),
                localRevert: () => addEvent(event),
                loadingMessage: "Vymazávam...",
                successMessage: "Udalosť vymazaná",
              });
            }}
          >
            Vymazať udalosť
            <TrashIcon className="h-4 w-4"></TrashIcon>
          </button>
        </div>
      </div>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          event.isExpanded || searchTerm
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
                {higlightedTickets > 0 ||
                  (highlightedCancelledTickets > 0 && (
                    <span>
                      <span className="font-semibold">
                        {higlightedTickets + highlightedCancelledTickets}{" "}
                      </span>
                      nájdených lítkov
                    </span>
                  ))}
                {highlightedCancelledTickets > 0 && (
                  <span>
                    z toho{" "}
                    <span className="font-semibold">
                      {highlightedCancelledTickets}{" "}
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
                  optimisticUpdate({
                    confirmation: `POZOR! Táto akcia je nevratná, stratíte všetky údaje. Naozaj chcete vymazať označené lístky (${selectedTickets.length})? Zvážte iba zmenu statusu na zrušené.`,
                    value: selectedTickets.map((t) => t.id),
                    localUpdate: () =>
                      removeTickets(selectedTickets.map((t) => t.id)),
                    databaseUpdate: () =>
                      deleteTickets(selectedTickets.map((t) => t.id)),
                    localRevert: () => addTickets(event.id, selectedTickets),
                    loadingMessage: "Vymazávam...",
                    successMessage: "Lístky vymazané",
                  });
                }}
              >
                Vymazať
              </button>
            </div>
            {event.tickets.length > 0 || event.cancelled_tickets.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <Table className="w-full">
                  <Table.Head>
                    <Table.HeadCell className="p-1 px-2">
                      <Checkbox
                        className="me-2"
                        checked={event.tickets.every((t) =>
                          selectedTickets.includes(t),
                        )}
                        onChange={() => {
                          const checked = !event.tickets.every((t) =>
                            selectedTickets.includes(t),
                          );
                          const ticketsToToggle = event.tickets.filter((t) =>
                            checked ? !selectedTickets.includes(t) : true,
                          );
                          ticketsToToggle.forEach((t) =>
                            toggleSelectedTicket(t.id),
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
                          onClick={() => toggleEventLockedArrived(event.id)}
                        >
                          {event.lockedArrived ? (
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
                    {event.tickets.length > 0 && (
                      <TicketRows event={event} cancelled={false} />
                    )}
                    {event.cancelled_tickets.length > 0 && (
                      <>
                        <Table.Row className="text-center">
                          <Table.Cell className="p-1" colSpan={9}>
                            <button
                              className="flex w-full items-center justify-center hover:underline"
                              onClick={() =>
                                toggleEventShowCancelledTickets(event.id)
                              }
                            >
                              <HiChevronDown
                                className={`${
                                  event.showCancelledTickets
                                    ? "rotate-180 transform"
                                    : ""
                                } h-4 w-4 transition-transform duration-500 group-hover:text-gray-600`}
                              />
                              Zrušené lístky
                            </button>
                          </Table.Cell>
                        </Table.Row>
                        {(event.showCancelledTickets ||
                          highlightedCancelledTickets > 0) && (
                          <TicketRows event={event} cancelled={true} />
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

export default function EventsComponent() {
  const {
    events: {
      events,
      isRefreshing,
      refresh,
      search,
      searchTerm,
      highlightedTicketIds,
    },
    services: { allServices },
  } = useStoreContext((state) => state);

  // refresh and search once mounted
  const query = useSearchParams().get("query");
  useEffect(() => {
    if (query) search({ query });
  }, []);

  return (
    <>
      <Header
        title="Udalosti"
        refresh={{ refresh, isRefreshing }}
        search={{
          search: (query: string) => search({ query: query }),
          searchTerm,
          results: highlightedTicketIds.length,
        }}
        actionButton={allServices.length === 0 || <EditEventButton />}
      />
      {events.length > 0 ? (
        <ol
          role="list"
          className={`w-auto divide-gray-400 rounded-xl border border-gray-200 p-2`}
        >
          {events.map((event) => (
            <EventDetail key={event.id} event={event} />
          ))}
        </ol>
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
