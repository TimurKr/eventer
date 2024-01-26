"use client";

import { useContext, useRef, useState } from "react";
import {
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { Badge, Dropdown, Progress, Table, Tooltip } from "flowbite-react";
import { HiChevronDown, HiTrash } from "react-icons/hi2";
import { LiaLinkSolid, LiaUnlinkSolid } from "react-icons/lia";
import NewTicketModal from "./NewTicketModal";
import {
  type EventWithTickets,
  deleteEvent,
  deleteTicket,
  updateTicketFields,
  updateTicketPaymentStatus,
  updateContactFields,
  updateEventPublicStatus,
  fetchTicketTypes,
  bulkInsertContacts,
  mergeContacts,
} from "./serverActions";
import NewEventModal from "./NewEventModal";
import { toast } from "react-toastify";
import { string as yupString, number as yupNumber } from "yup";
import { contactsEqual } from "./utils";
import { InstantInput } from "@/app/components/FormElements";
import { EventsContext, createEventsStore } from "./zustand";
import { useStore } from "zustand";
import { useSearchParams } from "next/navigation";

const ticketStatuses = ["rezervované", "zaplatené", "zrušené"];

function LinkUnlinkContact({
  identicalContactFound,
  contactUsage,
  groupSize,
  ticket,
  type,
}: {
  identicalContactFound: number;
  contactUsage: number;
  groupSize: number;
  ticket: EventWithTickets["tickets"][0];
  type: "guest" | "billing";
}) {
  const store = useContext(EventsContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const { refresh, setPartialTicket } = useStore(store, (state) => state);
  if (identicalContactFound < 2 && contactUsage < 2) return null;
  return (
    <div className="inline-flex">
      {identicalContactFound > 1 && (
        <div className={`inline-block p-1 `}>
          <Tooltip
            content={`Máte ${identicalContactFound} rôznych kontaktov s týmito údajmi. Kliknutím ich spojíte do jedného synchronizovaného.`}
          >
            <button
              onClick={async () => {
                const toastId = toast.loading("Spájam kontakty...");
                const r = await mergeContacts(ticket[type]!);
                if (r?.error) {
                  toast.update(toastId, {
                    render: r.error.message,
                    type: "error",
                    isLoading: false,
                    closeButton: true,
                  });
                  return;
                }
                refresh();
                toast.update(toastId, {
                  render: "Kontakty spojené",
                  type: "success",
                  isLoading: false,
                  autoClose: 1500,
                });
              }}
            >
              <LiaLinkSolid
                className={`inline h-4 w-4 text-green-500 hover:scale-105 active:scale-110 active:text-green-700`}
              />
            </button>
          </Tooltip>
        </div>
      )}
      {contactUsage > 1 && (groupSize > 1 || type === "guest") && (
        <div
          className={`inline-block p-1 ${
            type === "guest" ? "invisible group-hover:visible" : ""
          }`}
        >
          <Tooltip
            content={`Tento kontakt sa používa na ${
              contactUsage - 1
            } iných miestach. Kliknutím sem ${
              type === "guest"
                ? "zrušíte tento link a umožníte zmeny iba na tomto mieste."
                : "oddelíte jeden lístok z tejto skupiny."
            }`}
          >
            <button
              onClick={async () => {
                const toastId = toast.loading("Vytváram kópiu kontaktu...");
                const { id, created_at, ...contactData } = ticket[type]!;
                const r = await bulkInsertContacts([contactData]);
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
                    type === "billing" ? r.data[0].id : ticket.billing_id,
                  guest_id:
                    type === "guest" ||
                    contactsEqual(ticket.guest!, ticket.billing!)
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
                setPartialTicket({
                  id: ticket.id,
                  billing_id:
                    type === "billing" ? r.data[0].id : ticket.billing_id,
                  billing: type === "billing" ? r.data[0] : ticket.billing,
                  guest_id:
                    type === "guest" ||
                    contactsEqual(ticket.guest!, ticket.billing!)
                      ? r.data[0].id
                      : ticket.guest_id,
                  guest:
                    type === "guest" ||
                    contactsEqual(ticket.guest!, ticket.billing!)
                      ? r.data[0]
                      : ticket.guest,
                });
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
  const store = useContext(EventsContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");

  const {
    ticketTypes,
    highlightedTicketIds,
    setPartialTicket,
    setPartialContact,
    setTicketsStatus,
    removeTicket,
    addTickets,
  } = useStore(store, (state) => state);

  const allContacts = useStore(store, (state) =>
    state.events
      .flatMap((event) => event.tickets)
      .flatMap((ticket) => [ticket.guest!, ticket.billing!]),
  );
  const indexInEvent = tickets.findIndex((t) => t === ticket);
  const groupSize = tickets.filter(
    (t) => t.billing_id === ticket.billing_id,
  ).length;
  const indexInGroup = tickets
    .filter((t) => t.billing_id === ticket.billing_id)
    .findIndex((t) => t === ticket);

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
        {indexInEvent} - <span className="text-xs">{indexInGroup + 1}</span>
      </Table.Cell>
      <Table.Cell className="p-2 py-0">
        <select
          className={`rounded-md border-none px-2 py-0.5 text-xs font-semibold hover:cursor-pointer ${
            ticket.type === "VIP"
              ? "bg-emerald-400 text-black"
              : ticket.type === "standard"
                ? "bg-gray-200 text-gray-600"
                : ""
          }`}
          onChange={async (e) => {
            if (
              !confirm(
                `Naozaj chcete zmeniť typ lístka? Zmení sa ním aj cena.\n\nZmena: ${
                  ticket.type
                } => ${e.target.value}\n\nPo zmene bude:\n${e.target.value}: ${
                  tickets.filter((t) => t.type == e.target.value).length + 1
                } lístkov\n${ticket.type}: ${
                  tickets.filter((t) => t.type == ticket.type).length - 1
                } lístkov`,
              )
            )
              return;
            const originalType = ticket.type;
            const originalPrice = ticket.price;
            setPartialTicket({
              id: ticket.id,
              type: e.target.value,
              price: ticketTypes.find((t) => t.label == e.target.value)!.price,
            });
            const r = await updateTicketFields({
              id: ticket.id,
              type: e.target.value,
              price: ticketTypes.find((t) => t.label == e.target.value)!.price,
            });
            if (r.error) {
              setPartialTicket({
                id: ticket.id,
                type: originalType,
                price: originalPrice,
              });
              alert(r.error.message);
              return;
            }
          }}
          value={ticket.type}
        >
          {ticketTypes.map((type) => (
            <option key={type.label} value={type.label}>
              {type.label}
            </option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className="text-pretty group border-l p-0">
        <InstantInput
          defaultValue={ticket.guest!.name}
          type="text"
          inline
          placeholder="Meno"
          validate={async (value) =>
            value == "" ? "Meno nesmie byť prázdne" : null
          }
          updateDatabase={async (value) =>
            updateContactFields({
              id: ticket.guest_id,
              name: value,
            })
          }
          setLocalValue={(value) =>
            setPartialContact({ id: ticket.guest_id, name: value })
          }
        />
        <InstantInput
          defaultValue={ticket.guest!.phone}
          type="text"
          inline
          placeholder="Telefón"
          updateDatabase={(value) =>
            updateContactFields({
              id: ticket.guest_id,
              phone: value || null,
            })
          }
          setLocalValue={(value) =>
            setPartialContact({
              id: ticket.guest_id,
              phone: value,
            })
          }
        />
        <div className="inline-block">
          <InstantInput
            defaultValue={ticket.guest!.email}
            type="email"
            inline
            placeholder="Email"
            validate={(value) =>
              yupString()
                .email("Zadajte platný email")
                .validate(value)
                .then(() => null)
                .catch((err) => err.message)
            }
            updateDatabase={(value) =>
              updateContactFields({
                id: ticket.guest_id,
                email: value || null,
              })
            }
            setLocalValue={(value) =>
              setPartialContact({
                id: ticket.guest_id,
                email: value,
              })
            }
          />
          <LinkUnlinkContact
            identicalContactFound={
              allContacts
                .filter((c, i, a) => a.findIndex((c2) => c.id == c2.id) === i)
                .filter((c) => contactsEqual(c, ticket.guest!)).length
            }
            contactUsage={
              allContacts.filter((c) => c.id == ticket.guest_id).length
            }
            groupSize={groupSize}
            ticket={ticket}
            type="guest"
          />
        </div>
      </Table.Cell>
      {indexInGroup == 0 && (
        <Table.Cell className="group border-x p-1" rowSpan={groupSize}>
          <div className="flex flex-col">
            <div className="flex">
              <InstantInput
                defaultValue={ticket.billing!.name}
                type="text"
                placeholder="Meno"
                className="grow"
                validate={async (value) =>
                  value == "" ? "Meno nesmie byť prázdne" : null
                }
                updateDatabase={(value) =>
                  updateContactFields({
                    id: ticket.billing_id,
                    name: value,
                  })
                }
                setLocalValue={(value) =>
                  setPartialContact({
                    id: ticket.billing_id,
                    name: value,
                  })
                }
              />{" "}
              <LinkUnlinkContact
                identicalContactFound={
                  allContacts
                    .filter(
                      (c, i, a) => a.findIndex((c2) => c.id == c2.id) === i,
                    )
                    .filter((c) => contactsEqual(c, ticket.billing!)).length
                }
                contactUsage={
                  allContacts.filter((c) => c.id == ticket.billing_id).length
                }
                groupSize={groupSize}
                ticket={ticket}
                type="billing"
              />
            </div>
            <InstantInput
              defaultValue={ticket.billing!.phone}
              type="text"
              placeholder="Telefón"
              updateDatabase={(value) =>
                updateContactFields({
                  id: ticket.billing_id,
                  phone: value,
                })
              }
              setLocalValue={(value) =>
                setPartialContact({
                  id: ticket.billing_id,
                  phone: value,
                })
              }
            />
            <InstantInput
              defaultValue={ticket.billing!.email}
              type="email"
              placeholder="Email"
              validate={(value) =>
                yupString()
                  .email("Zadajte platný email")
                  .validate(value)
                  .then(() => null)
                  .catch((err) => err.message)
              }
              updateDatabase={(value) =>
                updateContactFields({
                  id: ticket.billing_id,
                  email: value,
                })
              }
              setLocalValue={(value) =>
                setPartialContact({
                  id: ticket.billing_id,
                  email: value,
                })
              }
            />
          </div>
        </Table.Cell>
      )}
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
            const toastId = toast.loading("Ukladám...");
            const originalStatus = ticket.payment_status;
            setTicketsStatus(IDs, e.target.value);
            const r = await updateTicketPaymentStatus(IDs, e.target.value);
            if (r.error) {
              setTicketsStatus(IDs, originalStatus);
              toast.update(toastId, {
                render: r.error.message,
                type: "error",
                isLoading: false,
                closeButton: true,
              });
              return;
            }
            toast.update(toastId, {
              render: "Status lístkov zmenený",
              type: "success",
              isLoading: false,
              autoClose: 1500,
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
      <Table.Cell className="whitespace-nowrap px-1 py-0 text-end">
        <InstantInput
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
              price: parseFloat(value),
            })
          }
          updateDatabase={(value) =>
            updateTicketFields({
              id: ticket.id,
              price: parseFloat(value),
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
            <EllipsisHorizontalIcon className="h-5 w-5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 hover:cursor-pointer hover:bg-gray-200" />
          )}
        >
          <Dropdown.Item onClick={() => alert("Táto funkcia ešte nefunguje")}>
            Premeň na kupón
          </Dropdown.Item>
          <Dropdown.Item
            className="text-red-500"
            icon={HiTrash}
            onClick={async () => {
              if (!confirm("Naozaj chcete vymazať tento lístok?")) return;
              const toastId = toast.loading("Vymazávam...");
              const removedTicket = ticket;
              removeTicket(ticket.id);
              const r = await deleteTicket(ticket.id);
              if (r.error) {
                addTickets(ticket.event_id, [removedTicket]);
                toast.update(toastId, {
                  render: r.error.message,
                  type: "error",
                  isLoading: false,
                  closeButton: true,
                });
                return;
              }
              toast.update(toastId, {
                render: "Lístok vymazaný",
                type: "success",
                isLoading: false,
                autoClose: 1500,
              });
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
  eventId,
  cancelled,
}: {
  eventId: number;
  cancelled: boolean;
}) {
  const store = useContext(EventsContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const tickets = useStore(store, (state) => {
    const event = state.events.find((e) => e.id == eventId)!;
    return cancelled ? event.cancelled_tickets : event.tickets;
  });

  return (
    <>
      {tickets
        .map((t) => t.billing_id)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((billing_id) => (
          <>
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
          </>
        ))}
      {tickets[0].payment_status != "zrušené" && (
        <Table.Row className="h-1">
          <Table.Cell className="p-1" colSpan={5} />
          <Table.Cell className="p-1 text-end font-bold tracking-wider text-black">
            <hr />
            {tickets.reduce((acc, t) => acc + t.price, 0)} €
          </Table.Cell>
          <Table.Cell className="p-1" colSpan={1} />
        </Table.Row>
      )}
    </>
  );
}

function EventRow({ eventId }: { eventId: number }) {
  const store = useContext(EventsContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const event = useStore(
    store,
    (state) => state.events.find((e) => e.id == eventId)!,
  );
  const {
    ticketTypes,
    toggleEventIsPublic,
    removeEvent,
    addEvent,
    searchTerm,
  } = useStore(store, (state) => state);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showCancelled, setShowCancelled] = useState<boolean>(false);

  return (
    <li key={eventId} className={`flex flex-col`}>
      <div className="flex justify-between gap-x-6 p-1 ps-3">
        <div className="flex min-w-0 flex-1 flex-col self-center">
          <p className="flex items-center gap-4 text-sm font-semibold leading-6 text-gray-900">
            {new Date(event.datetime).toLocaleDateString("sk-SK")}
            <Badge
              color={event.is_public ? "blue" : "purple"}
              className="rounded-md"
            >
              {event.is_public ? "Verejné" : "Súkromné"}
            </Badge>
          </p>
          <p className="truncate text-xs leading-5 text-gray-500">
            {new Date(event.datetime).toLocaleTimeString("sk-SK")}
          </p>
        </div>
        <div className="flex flex-col items-center justify-start gap-1 lg:flex-row lg:gap-4">
          {ticketTypes.map((type) => {
            const sold = event.tickets.filter(
              (t) => t.type == type.label,
            ).length;
            return (
              <div key={type.label} className="w-28">
                <div
                  className={`flex items-end text-sm ${
                    type.label == "VIP"
                      ? "text-amber-600"
                      : type.label == "standard"
                        ? "text-gray-600"
                        : ""
                  }`}
                >
                  <span className="font-medium">{type.label}</span>
                  <span
                    className={`ms-auto text-base font-bold ${
                      sold > type.max_sold
                        ? "text-red-600"
                        : sold == 0
                          ? "text-gray-400"
                          : ""
                    }`}
                  >
                    {event.tickets.filter((t) => t.type == type.label).length}
                  </span>
                  /<span>{type.max_sold}</span>
                </div>
                <Progress
                  size="sm"
                  progress={
                    (event.tickets.filter((t) => t.type == type.label).length /
                      type.max_sold) *
                    100
                  }
                  color={
                    sold > type.max_sold
                      ? "red"
                      : type.label == "VIP"
                        ? "yellow"
                        : "gray"
                  }
                />
              </div>
            );
          })}
        </div>
        <div className="flex flex-row items-center justify-start">
          <NewTicketModal eventId={eventId} />
          <button
            className="group grid h-full place-content-center ps-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="rounded-md border border-slate-200 p-0.5 group-hover:bg-slate-200">
              <HiChevronDown
                className={`${
                  isExpanded || searchTerm != undefined
                    ? "rotate-180 transform"
                    : ""
                } h-4 w-4 transition-transform duration-500 `}
              />
            </div>
          </button>
        </div>
      </div>
      <div
        className={`grid overflow-y-hidden rounded-xl bg-slate-200 text-sm text-slate-600 transition-all duration-300 ease-in-out ${
          isExpanded || searchTerm
            ? "my-2 grid-rows-[1fr] p-2 opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex items-start gap-2 pb-1">
            <p className="ps-2 text-lg font-medium tracking-wider text-gray-900">
              Lístky
            </p>
            <button
              className="ms-auto rounded-md bg-cyan-600 px-2 py-0.5 text-xs text-white hover:bg-cyan-700"
              onClick={async () => {
                toggleEventIsPublic(event.id);
                const r = await updateEventPublicStatus(
                  event.id,
                  !event.is_public,
                );
                if (r.error) {
                  toggleEventIsPublic(event.id);
                  alert(r.error.message);
                  return;
                }
              }}
            >
              {event.is_public ? "Spraviť súkromným" : "Zverejniť"}
            </button>
            <button
              className="rounded-md bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700"
              onClick={async () => {
                if (event.tickets.length > 0) {
                  alert(
                    "Nemôžete vymazať termín, ktorý má predané lístky. Najprv vymažte lístky.",
                  );
                  return;
                }
                if (!confirm("Naozaj chcete vymazať tento termín?")) return;
                const removedEvent = event;
                removeEvent(event.id);
                const toastId = toast.loading("Vymazávam...");
                const r = await deleteEvent(event.id);
                if (r.error) {
                  addEvent(removedEvent);
                  toast.update(toastId, {
                    render: r.error.message,
                    type: "error",
                    isLoading: false,
                    closeButton: true,
                  });
                  return;
                }
                toast.update(toastId, {
                  render: "Termín vymazaný",
                  type: "success",
                  isLoading: false,
                  autoClose: 1500,
                });
              }}
            >
              Vymazať
            </button>
          </div>
          {event.tickets.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <Table.Head>
                  <Table.HeadCell className="p-1 px-2">#</Table.HeadCell>
                  <Table.HeadCell className="p-1 px-2">Typ</Table.HeadCell>
                  <Table.HeadCell className="p-1 text-center" colSpan={1}>
                    Hostia
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-center">
                    Platca
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-center">
                    Status
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-end">Cena</Table.HeadCell>
                  <Table.HeadCell className="p-1">
                    <span className="sr-only">Edit</span>
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  <TicketRows eventId={eventId} cancelled={false} />
                  {event.cancelled_tickets.length > 0 && (
                    <>
                      <Table.Row className="text-center">
                        <Table.Cell className="p-1" colSpan={9}>
                          <button
                            className="flex w-full items-center justify-center hover:underline"
                            onClick={() => setShowCancelled(!showCancelled)}
                          >
                            <HiChevronDown
                              className={`${
                                showCancelled ? "rotate-180 transform" : ""
                              } h-4 w-4 transition-transform duration-500 group-hover:text-gray-600`}
                            />
                            Zrušené lístky
                          </button>
                        </Table.Cell>
                      </Table.Row>
                      {showCancelled && (
                        <TicketRows eventId={eventId} cancelled={true} />
                      )}
                    </>
                  )}
                </Table.Body>
              </Table>
            </div>
          ) : (
            <p className="text-center">Žiadne lístky</p>
          )}
        </div>
      </div>
    </li>
  );
}

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
