"use client";

import { Events, Tickets } from "@/utils/supabase/database.types";
import { useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Progress,
  Table,
} from "flowbite-react";
import { HiChevronDown } from "react-icons/hi2";
import Link from "next/link";
import NewTicketModal from "./NewTicketModal";
import { changeEventPublicStatus, deleteEvent } from "./serverActions";
import { useImmer } from "use-immer";
import NewEventModal from "./NewEventModal";

export default function EventsAccordion(props: {
  events: (Events & { tickets: Tickets[] })[];
}) {
  // Create a state for the accordion
  const [expanded, setExpanded] = useState<Events["id"][]>([]);
  const [events, setEvents] = useImmer<(Events & { tickets: Tickets[] })[]>(
    props.events,
  );

  const ticketTypes = [
    { label: "VIP", color: "yellow", max_sold: 6 },
    { label: "standard", color: "gray", max_sold: 24 },
  ];

  const ticketStatuses = [
    { label: "rezervované", color: "yellow" },
    { label: "zaplatené", color: "green" },
    { label: "zrušené", color: "red" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold tracking-wider">
          Termíny Tajomných Variácií
        </p>
        <NewEventModal setEvents={setEvents} />
      </div>
      <ul
        role="list"
        className={`w-auto divide-y divide-gray-300 rounded-xl border border-gray-200 p-2`}
      >
        {events.map((event) => (
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
              <div className="flex flex-col items-center justify-start gap-1 lg:flex-row lg:gap-2">
                {ticketTypes.map((type) => (
                  <div key={type.label} className="w-24">
                    <div className="flex items-end justify-between">
                      <span
                        className={`text-xs font-medium text-${type.color}-600`}
                      >
                        {type.label}
                      </span>
                      <span
                        className={`text-sm font-medium text-${type.color}-600`}
                      >
                        {
                          event.tickets.filter((t) => t.type == type.label)
                            .length
                        }
                      </span>
                    </div>
                    <Progress
                      size="sm"
                      progress={
                        (event.tickets.filter((t) => t.type == type.label)
                          .length /
                          type.max_sold) *
                        100
                      }
                      color={type.color}
                      // className="border border-gray-300 bg-white"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-row items-center justify-start gap-1">
                <NewTicketModal event={event} setEvents={setEvents} />
                <button
                  className="flex justify-center rounded-md bg-gray-200 p-0.5 hover:bg-gray-300"
                  onClick={() =>
                    setExpanded(
                      expanded.includes(event.id)
                        ? expanded.filter((e) => e != event.id)
                        : [...expanded, event.id],
                    )
                  }
                  aria-expanded={expanded.includes(event.id)}
                  aria-controls={`event-details-${event.id}`}
                >
                  <HiChevronDown
                    className={`${
                      expanded.includes(event.id) ? "rotate-180 transform" : ""
                    } h-4 w-4 transition-transform duration-500 group-hover:text-gray-600`}
                  />
                </button>
              </div>
            </div>

            {/* Below is the expanded part */}
            <div
              id={`event-details-${event.id}`}
              role="region"
              className={`grid overflow-y-hidden rounded-xl bg-slate-200 text-sm text-slate-600 transition-all duration-300 ease-in-out ${
                expanded.includes(event.id)
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
                      setEvents((draft) => {
                        const index = draft.findIndex((e) => e.id == event.id);
                        draft[index].is_public = !event.is_public;
                      });
                      const r = await changeEventPublicStatus(
                        event.id,
                        !event.is_public,
                      );
                      if (r.error) {
                        setEvents((draft) => {
                          const index = draft.findIndex(
                            (e) => e.id == event.id,
                          );
                          draft[index].is_public = !event.is_public;
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
                    onClick={async () => {
                      if (event.tickets.length > 0) {
                        alert(
                          "Nemôžete vymazať termín, ktorý má predané lístky. Najprv vymažte lístky.",
                        );
                        return;
                      }
                      if (!confirm("Naozaj chcete vymazať tento termín?"))
                        return;
                      const removedEvent = events.find((e) => e.id == event.id);
                      setEvents((draft) => {
                        draft.splice(
                          draft.findIndex((e) => e.id == event.id),
                          1,
                        );
                      });
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
                        alert(r.error.message);
                        return;
                      }
                    }}
                  >
                    Vymazať
                  </button>
                </div>
                {event.tickets.length > 0 ? (
                  <div className="overflow-x-scroll">
                    <Table hoverable className="w-full">
                      <Table.Head>
                        <Table.HeadCell className="p-1 px-2">
                          Typ
                        </Table.HeadCell>
                        <Table.HeadCell className="p-1"></Table.HeadCell>
                        <Table.HeadCell className="p-1">Hosť</Table.HeadCell>
                        <Table.HeadCell className="p-1">Platca</Table.HeadCell>
                        <Table.HeadCell className="p-1 text-end">
                          Status
                        </Table.HeadCell>
                        <Table.HeadCell className="p-1 text-end">
                          Cena
                        </Table.HeadCell>
                        <Table.HeadCell className="p-1">
                          <span className="sr-only">Edit</span>
                        </Table.HeadCell>
                      </Table.Head>
                      <Table.Body className="">
                        {event.tickets.map((ticket, i) => (
                          <Table.Row
                            key={ticket.id}
                            className={`${
                              i != 0 &&
                              event.tickets[i - 1].billing_name !=
                                ticket.billing_name
                                ? "border-t"
                                : ""
                            } ${
                              event.tickets
                                .map((t) => t.billing_name)
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .findIndex((n) => n == ticket.billing_name) %
                                2 ==
                              0
                                ? "bg-slate-50"
                                : "bg-slate-100"
                            }`}
                          >
                            <Table.Cell className="p-2">{i + 1}</Table.Cell>
                            <Table.Cell className="p-2">
                              <Badge
                                className="inline-block"
                                color={
                                  ticketTypes.find(
                                    (t) => ticket.type === t.label,
                                  )?.color || "info"
                                }
                              >
                                {ticket.type}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap p-1 font-medium text-gray-900 dark:text-white">
                              {ticket.name}
                              {ticket.phone && (
                                <>
                                  {" - "}
                                  <span>{ticket.phone}</span>
                                </>
                              )}
                              {ticket.email && (
                                <>
                                  {" - "}
                                  <span>{ticket.email}</span>
                                </>
                              )}
                            </Table.Cell>
                            <Table.Cell className={`text-ellipsis p-1`}>
                              {/* <div
                              className={`h-auto ${
                                event.tickets
                                  .map((t) => t.billing_name)
                                  .filter((v, i, a) => a.indexOf(v) === i)
                                  .findIndex((n) => n == ticket.billing_name) %
                                  2 ==
                                0
                                  ? "bg-slate-50 hover:bg-slate-100"
                                  : "bg-slate-200 hover:bg-slate-100"
                              } ${""}`}
                            > */}
                              {ticket.billing_name}
                              {ticket.billing_phone && (
                                <>
                                  {" - "}
                                  <span>{ticket.billing_phone}</span>
                                </>
                              )}
                              {ticket.billing_email && (
                                <>
                                  {" - "}
                                  <span>{ticket.billing_email}</span>
                                </>
                              )}
                              {/* </div> */}
                            </Table.Cell>
                            <Table.Cell className="p-1 text-end">
                              <Badge
                                className="inline-block rounded-md"
                                color={
                                  ticketStatuses.find(
                                    (t) => ticket.payment_status === t.label,
                                  )?.color || "info"
                                }
                              >
                                {ticket.payment_status}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap p-1 text-end">
                              {ticket.price} €
                            </Table.Cell>
                            <Table.Cell className="p-1">
                              <Dropdown
                                label=""
                                dismissOnClick={false}
                                renderTrigger={() => (
                                  <EllipsisHorizontalIcon className="h-6 w-6 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 hover:cursor-pointer hover:bg-gray-200" />
                                )}
                              >
                                <Dropdown.Item>Dashboard</Dropdown.Item>
                                <Dropdown.Item>Settings</Dropdown.Item>
                                <Dropdown.Item>Earnings</Dropdown.Item>
                                <Dropdown.Item>Sign out</Dropdown.Item>
                              </Dropdown>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center">Žiadne lístky</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
