"use client";

import { Events, Tickets } from "@/utils/supabase/database.types";
import { useState } from "react";
import {
  ArrowPathIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/solid";
import { Badge, Dropdown, Progress, Table } from "flowbite-react";
import { HiChevronDown, HiTrash } from "react-icons/hi2";
import NewTicketModal from "./NewTicketModal";
import {
  type EventWithTickets,
  changeEventPublicStatus,
  deleteEvent,
  deleteTicket,
  fetchEvents,
  updateTicketFields,
  updateTicketPaymentStatus,
} from "./serverActions";
import { DraftFunction, Updater, useImmer } from "use-immer";
import NewEventModal from "./NewEventModal";
import { toast } from "react-toastify";
import { string as yupString, number as yupNumber } from "yup";
import { ticketSortFunction } from "./utils";

const ticketTypes = [
  { label: "VIP", max_sold: 6, price: 100 },
  { label: "standard", max_sold: 24, price: 80 },
];

const ticketStatuses = ["rezervované", "zaplatené", "zrušené"];

function InstantInput({
  type = "text",
  value,
  placeholder,
  inline = false,
  className,
  validate,
  updateDatabase,
  setLocalValue,
}: {
  type: "text" | "number" | "email" | "tel";
  value?: string | null;
  placeholder?: string;
  inline?: boolean;
  className?: string;
  validate?: (value: string) => Promise<string | null>;
  updateDatabase: (value: string) => Promise<any>;
  setLocalValue: (value: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <input
      type={type}
      className={`mx-1 rounded-md border-gray-200 bg-gray-50 p-0 px-1 text-sm font-normal text-black placeholder:text-xs ${
        error ? "bg-red-50 focus:border-red-500 focus:ring-red-500" : ""
      } ${inline ? "font-mono" : ""} ${className}`}
      defaultValue={value || undefined}
      size={inline ? value?.length || 5 : undefined}
      onChange={async (e) => {
        if (validate) {
          const err = await validate(e.target.value);
          if (err) setError(err);
          else setError(null);
        }
        if (inline) e.target.size = e.target.value.length || 4;
      }}
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onBlur={async (e) => {
        if (e.target.value == (value || "")) {
          setError(null);
          return;
        }
        const err = validate && (await validate(e.target.value));
        if (err) {
          e.target.focus();
          setError(err);
          toast.error(err, {
            autoClose: 2000,
          });
          e.target.value = value || "";
          return;
        }
        setError(null);
        toast
          .promise(
            updateDatabase(e.target.value),
            {
              pending: "Ukladám...",
              success: "Uložené",
              error: "Nastala chyba",
            },
            {
              autoClose: 1000,
              hideProgressBar: true,
            },
          )
          .then((r) => {
            if (r.error) e.target.value = value || "";
            else setLocalValue(e.target.value);
          });
      }}
    />
  );
}

function TicketRows({
  tickets,
  setEvent,
}: {
  tickets: Tickets[];
  setEvent: Updater<EventWithTickets>;
}) {
  return (
    <>
      {tickets
        .map((t) => t.billing_name)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((billing_name) => {
          const groupSize = tickets.filter(
            (t) => t.billing_name == billing_name,
          ).length;
          return (
            <>
              <Table.Row key={billing_name} className="h-1"></Table.Row>
              {tickets
                .filter((t) => t.billing_name == billing_name)
                .map((ticket, indexInGroup) => {
                  return (
                    <Table.Row
                      key={ticket.id}
                      className={`${
                        ticket.payment_status == "zrušené"
                          ? "bg-red-50"
                          : "bg-white"
                      }`}
                    >
                      <Table.Cell
                        className={`whitespace-nowrap p-0 pl-2 ${
                          indexInGroup == 0 && "rounded-tl-md"
                        } ${indexInGroup == groupSize - 1 && "rounded-bl-md"}`}
                      >
                        {tickets.findIndex((t) => t === ticket) + 1} -{" "}
                        <span className="text-xs">{indexInGroup + 1}</span>
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
                                } => ${e.target.value}\n\nPo zmene bude:\n${
                                  e.target.value
                                }: ${
                                  tickets.filter(
                                    (t) => t.type == e.target.value,
                                  ).length + 1
                                } lístkov\n${ticket.type}: ${
                                  tickets.filter((t) => t.type == ticket.type)
                                    .length - 1
                                } lístkov`,
                              )
                            )
                              return;
                            const originalType = ticket.type;
                            const originalPrice = ticket.price;
                            setEvent((draft) => {
                              const t = draft.tickets.find(
                                (t) => t.id == ticket.id,
                              )!;
                              t.type = e.target.value;
                              t.price = ticketTypes.find(
                                (type) => type.label == e.target.value,
                              )!.price;
                            });
                            const r = await updateTicketFields({
                              id: ticket.id,
                              type: e.target.value,
                              price: ticketTypes.find(
                                (type) => type.label == e.target.value,
                              )!.price,
                            });
                            if (r.error) {
                              setEvent((draft) => {
                                draft.tickets.find(
                                  (t) => t.id == ticket.id,
                                )!.type = originalType;
                                draft.tickets.find(
                                  (t) => t.id == ticket.id,
                                )!.price = originalPrice;
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
                      <Table.Cell className="border-l p-0">
                        <InstantInput
                          value={ticket.name}
                          type="text"
                          placeholder="Meno"
                          validate={async (value) =>
                            value == "" ? "Meno nesmie byť prázdne" : null
                          }
                          updateDatabase={(value) =>
                            updateTicketFields({
                              id: ticket.id,
                              name: value,
                            })
                          }
                          setLocalValue={(value) =>
                            setEvent((draft) => {
                              draft.tickets.find(
                                (t) => t.id == ticket.id,
                              )!.name = value;
                            })
                          }
                        />
                      </Table.Cell>
                      <Table.Cell className="p-0">
                        <InstantInput
                          value={ticket.phone}
                          type="text"
                          placeholder="Telefón"
                          updateDatabase={(value) =>
                            updateTicketFields({
                              id: ticket.id,
                              phone: value || null,
                            })
                          }
                          setLocalValue={(value) =>
                            setEvent((draft) => {
                              draft.tickets.find(
                                (t) => t.id == ticket.id,
                              )!.phone = value;
                            })
                          }
                        />
                      </Table.Cell>
                      <Table.Cell className="p-0">
                        <InstantInput
                          value={ticket.email}
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
                            updateTicketFields({
                              id: ticket.id,
                              email: value || null,
                            })
                          }
                          setLocalValue={(value) =>
                            setEvent((draft) => {
                              draft.tickets.find(
                                (t) => t.id == ticket.id,
                              )!.email = value;
                            })
                          }
                        />
                      </Table.Cell>
                      {indexInGroup == 0 && (
                        <Table.Cell
                          className="border-x p-1"
                          rowSpan={groupSize}
                        >
                          <div className="flex flex-col gap-1">
                            <InstantInput
                              value={ticket.billing_name}
                              type="text"
                              placeholder="Meno"
                              validate={async (value) =>
                                value == "" ? "Meno nesmie byť prázdne" : null
                              }
                              updateDatabase={(value) =>
                                updateTicketFields({
                                  id: ticket.id,
                                  billing_name: value,
                                })
                              }
                              setLocalValue={(value) =>
                                setEvent((draft) => {
                                  draft.tickets.find(
                                    (t) => t.id == ticket.id,
                                  )!.billing_name = value;
                                })
                              }
                            />
                            <InstantInput
                              value={ticket.billing_phone}
                              type="text"
                              placeholder="Telefón"
                              updateDatabase={(value) =>
                                updateTicketFields({
                                  id: ticket.id,
                                  billing_phone: value,
                                })
                              }
                              setLocalValue={(value) =>
                                setEvent((draft) => {
                                  draft.tickets.find(
                                    (t) => t.id == ticket.id,
                                  )!.billing_phone = value;
                                })
                              }
                            />
                            <InstantInput
                              value={ticket.billing_email}
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
                                updateTicketFields({
                                  id: ticket.id,
                                  billing_email: value,
                                })
                              }
                              setLocalValue={(value) =>
                                setEvent((draft) => {
                                  draft.tickets.find(
                                    (t) => t.id == ticket.id,
                                  )!.billing_email = value;
                                })
                              }
                            />
                          </div>
                        </Table.Cell>
                      )}
                      <Table.Cell className="p-1 text-end">
                        <select
                          className={`rounded-md border-none px-2 py-0.5 text-xs font-semibold hover:cursor-pointer ${
                            ticket.payment_status === "rezervované"
                              ? "bg-yellow-200 text-yellow-600"
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
                                  t.billing_name == ticket.billing_name &&
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
                            const originalStatus = ticket.payment_status;
                            setEvent((draft) => {
                              const allTickets = [
                                ...draft.tickets,
                                ...draft.cancelled_tickets,
                              ];
                              allTickets.forEach((t) => {
                                if (IDs.includes(t.id))
                                  t.payment_status = e.target.value;
                              });
                              draft.tickets = allTickets.filter(
                                (t) => t.payment_status != "zrušené",
                              );
                              draft.cancelled_tickets = allTickets.filter(
                                (t) => t.payment_status == "zrušené",
                              );
                            });

                            const r = await updateTicketPaymentStatus(
                              IDs,
                              e.target.value,
                            );
                            if (r.error) {
                              setEvent((draft) => {
                                const allTickets = [
                                  ...draft.tickets,
                                  ...draft.cancelled_tickets,
                                ];
                                allTickets.forEach((t) => {
                                  if (IDs.includes(t.id))
                                    t.payment_status = originalStatus;
                                });
                                draft.tickets = allTickets.filter(
                                  (t) => t.payment_status != "zrušené",
                                );
                                draft.cancelled_tickets = allTickets.filter(
                                  (t) => t.payment_status == "zrušené",
                                );
                              });
                              alert(r.error.message);
                              return;
                            }
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
                          value={ticket.price.toString()}
                          placeholder="Cena"
                          inline={true}
                          className="me-0"
                          setLocalValue={(value) =>
                            setEvent((draft) => {
                              draft.tickets.find(
                                (t) => t.id == ticket.id,
                              )!.price = parseFloat(value);
                            })
                          }
                          updateDatabase={(value) =>
                            updateTicketFields({
                              id: ticket.id,
                              price: parseFloat(value),
                            })
                          }
                          validate={async (value) =>
                            yupNumber()
                              .min(0)
                              .validate(value)
                              .then(() => null)
                              .catch((err) => err.message)
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
                          <Dropdown.Item
                            onClick={() => alert("Táto funkcia ešte nefunguje")}
                          >
                            Premeň na kupón
                          </Dropdown.Item>
                          <Dropdown.Item
                            className="text-red-500"
                            icon={HiTrash}
                            onClick={async () => {
                              if (
                                !confirm("Naozaj chcete vymazať tento lístok?")
                              )
                                return;
                              const toastId = toast.loading("Vymazávam...");
                              const removedTicket = tickets.find(
                                (t) => t.id == ticket.id,
                              );
                              const index = tickets.findIndex(
                                (t) => t.id == ticket.id,
                              );
                              setEvent((draft) => {
                                draft.tickets.splice(
                                  draft.tickets.findIndex(
                                    (t) => t.id == ticket.id,
                                  ),
                                  1,
                                );
                              });
                              const r = await deleteTicket(ticket.id);
                              if (r.error) {
                                setEvent((draft) => {
                                  draft.tickets.splice(
                                    index,
                                    0,
                                    removedTicket!,
                                  );
                                });
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
                                autoClose: 1000,
                              });
                            }}
                          >
                            Vymazať
                          </Dropdown.Item>
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
            </>
          );
        })}
      {tickets[0].payment_status != "zrušené" && (
        <Table.Row className="h-1">
          <Table.Cell className="p-1" colSpan={7} />
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

function EventRow({
  event,
  setEvent,
  removeEvent,
}: {
  event: EventWithTickets;
  setEvent: Updater<EventWithTickets>;
  removeEvent: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showCancelled, setShowCancelled] = useState<boolean>(false);
  return (
    <li key={event.id} className={`flex flex-col p-1`}>
      <div className="mx-2 flex justify-between gap-x-6">
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
        <div className="flex flex-row items-center justify-start gap-1">
          <NewTicketModal
            event={event}
            ticketTypes={ticketTypes}
            insertLocalTickets={(tickets) =>
              setEvent((draft) => {
                draft.tickets.push(
                  ...tickets.filter((t) => t.payment_status != "zrušené"),
                );
                draft.cancelled_tickets.push(
                  ...tickets.filter((t) => t.payment_status == "zrušené"),
                );
                draft.tickets.sort(ticketSortFunction);
                draft.cancelled_tickets.sort(ticketSortFunction);
              })
            }
          />
          <button
            className="flex justify-center rounded-md bg-gray-200 p-0.5 hover:bg-gray-300"
            onClick={() => setIsExpanded(!isExpanded)}
            // aria-expanded={isExpanded}
            // aria-controls={`event-details-${event.id}`}
          >
            <HiChevronDown
              className={`${
                isExpanded ? "rotate-180 transform" : ""
              } h-4 w-4 transition-transform duration-500 group-hover:text-gray-600`}
            />
          </button>
        </div>
      </div>

      {/* Below is the expanded part */}
      <div
        // id={`event-details-${event.id}`}
        // role="region"
        className={`grid overflow-y-hidden rounded-xl bg-slate-200 text-sm text-slate-600 transition-all duration-300 ease-in-out ${
          isExpanded
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
                setEvent((draft) => (draft.is_public = !draft.is_public));
                const r = await changeEventPublicStatus(
                  event.id,
                  !event.is_public,
                );
                if (r.error) {
                  setEvent((draft) => {
                    draft.is_public = !event.is_public;
                  });
                  alert(r.error.message);
                  return;
                }
              }}
            >
              {event.is_public ? "Spraviť súkromným" : "Zverejniť"}
            </button>
            <button
              className="rounded-md bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700"
              onClick={removeEvent}
            >
              Vymazať
            </button>
          </div>
          {event.tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <Table.Head>
                  <Table.HeadCell className="p-1 px-2">#</Table.HeadCell>
                  <Table.HeadCell className="p-1 px-2">Typ</Table.HeadCell>
                  <Table.HeadCell className="p-1 text-center" colSpan={3}>
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
                  <TicketRows tickets={event.tickets} setEvent={setEvent} />
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
                        <TicketRows
                          tickets={event.cancelled_tickets}
                          setEvent={setEvent}
                        />
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

export default function EventsAccordion(props: { events: EventWithTickets[] }) {
  // Create a state for the accordion
  const [expanded, setExpanded] = useState<Events["id"][]>([]);
  const [events, setEvents] = useImmer<EventWithTickets[]>(props.events);
  const getEventSetter =
    (eventIndex: number) =>
    (updater: EventWithTickets | DraftFunction<EventWithTickets>) => {
      setEvents((draft) => {
        if (typeof updater == "function") updater(draft[eventIndex]);
        else draft[eventIndex] = updater;
        draft[eventIndex].tickets.sort(ticketSortFunction);
        draft[eventIndex].cancelled_tickets.sort(ticketSortFunction);
      });
    };

  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshEvents() {
    setIsRefreshing(true);
    const r = await fetchEvents();
    if (r.error) {
      toast.error(r.error.message);
      return;
    }
    setEvents(r.data);
    setIsRefreshing(false);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-4 text-2xl font-bold tracking-wider">
          Termíny Tajomných Variácií
          <button
            className="flex items-center gap-2 rounded-md border border-gray-200 p-1 px-2 text-sm font-normal hover:bg-gray-100"
            onClick={refreshEvents}
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${isRefreshing && "animate-spin"}`}
            />
            Obnoviť
          </button>
        </p>
        <NewEventModal setEvents={setEvents} />
      </div>
      <ul
        role="list"
        className={`w-auto divide-y divide-gray-300 rounded-xl border border-gray-200 p-2`}
      >
        {events.map((event, eventIndex) => (
          <EventRow
            key={event.id}
            event={event}
            setEvent={getEventSetter(eventIndex)}
            removeEvent={async () => {
              if (event.tickets.length > 0) {
                alert(
                  "Nemôžete vymazať termín, ktorý má predané lístky. Najprv vymažte lístky.",
                );
                return;
              }
              if (!confirm("Naozaj chcete vymazať tento termín?")) return;
              const removedEvent = event;
              setEvents((draft) => {
                draft.splice(eventIndex, 1);
              });
              const toastId = toast.loading("Vymazávam...");
              const r = await deleteEvent(event.id);
              if (r.error) {
                setEvents((draft) => {
                  draft.push(removedEvent!);
                  draft.sort((a, b) => {
                    return (
                      new Date(b.datetime).getTime() -
                      new Date(a.datetime).getTime()
                    );
                  });
                });
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
                autoClose: 1000,
              });
            }}
          />
        ))}
      </ul>
    </>
  );
}
