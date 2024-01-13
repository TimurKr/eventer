"use client";

import { Events, Tickets } from "@/utils/supabase/database.types";
import { useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { types } from "util";
import { Badge, Button, Checkbox, Progress, Table } from "flowbite-react";
import { HiChevronDown } from "react-icons/hi2";
import Link from "next/link";
import NewTicketModal from "./NewTicketModal";
import { changeEventPublicStatus, deleteEvent } from "./eventServerActions";

export default function EventsAccordion({
  events,
}: {
  events: (Events & { tickets: Tickets[] })[];
}) {
  // Create a state for the accordion
  const [expanded, setExpanded] = useState<Events["id"][]>([]);

  return (
    <ul
      role="list"
      className={`w-auto divide-y divide-gray-300 rounded-xl border border-gray-200 p-2 ${
        expanded.length > 0 ? "bg-gray-100" : ""
      }`}
    >
      {events.map((event) => {
        // Get all unique ticket types
        const ticketTypes = [
          { label: "VIP", color: "yellow", max_sold: 6 },
          { label: "standard", color: "gray", max_sold: 24 },
        ];

        return (
          <li
            key={event.id}
            className={`flex flex-col rounded-lg p-2 py-1 ${
              expanded.includes(event.id) ? "bg-white" : ""
            }`}
          >
            <div className="flex justify-between gap-x-6">
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
              <div className="flex flex-col items-center justify-start gap-1 lg:flex-row lg:items-center">
                <NewTicketModal event={event} />
                <button
                  // size="xs"
                  // color="light"
                  className="flex justify-center rounded-md border border-gray-300 bg-gray-100 p-1 hover:bg-gray-100"
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
            <div
              id={`event-details-${event.id}`}
              role="region"
              className={`grid overflow-hidden text-sm text-slate-600 transition-all duration-300 ease-in-out ${
                expanded.includes(event.id)
                  ? "grid-rows-[1fr] pt-2 opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-x-auto">
                {event.tickets.length > 0 ? (
                  <Table hoverable>
                    <Table.Head>
                      <Table.HeadCell className="p-1 ps-2">Typ</Table.HeadCell>
                      <Table.HeadCell className="p-1">Hosť</Table.HeadCell>
                      <Table.HeadCell className="p-1">Telefón</Table.HeadCell>
                      <Table.HeadCell className="p-1">Email</Table.HeadCell>
                      <Table.HeadCell className="p-1 text-center">
                        Platca
                      </Table.HeadCell>
                      <Table.HeadCell className="p-1 text-end">
                        Cena
                      </Table.HeadCell>
                      <Table.HeadCell className="p-1">
                        <span className="sr-only">Edit</span>
                      </Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                      {event.tickets.map((ticket) => (
                        <Table.Row
                          key={ticket.id}
                          className="bg-white dark:border-gray-700 dark:bg-gray-800"
                        >
                          <Table.Cell className="p-1">
                            <Badge
                              className="inline-block"
                              color={
                                ticketTypes.find((t) => ticket.type === t.label)
                                  ?.color || "info"
                              }
                            >
                              {ticket.type}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell className="whitespace-nowrap p-1 font-medium text-gray-900 dark:text-white">
                            {ticket.name}
                          </Table.Cell>
                          <Table.Cell className="p-1">
                            {ticket.phone}
                          </Table.Cell>
                          <Table.Cell className="p-1">
                            {ticket.email}
                          </Table.Cell>
                          <Table.Cell className="flex justify-center p-1">
                            {!ticket.billing_name ? (
                              <Link href={`#`}>
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              </Link>
                            ) : (
                              "-"
                            )}
                          </Table.Cell>
                          <Table.Cell className="p-1 text-end">
                            {ticket.price} €
                          </Table.Cell>
                          <Table.Cell className="p-1">
                            <EllipsisHorizontalIcon className="h-5 w-5 text-blue-500" />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ) : (
                  <p className="text-center">Žiadne lístky</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    className="rounded-md bg-cyan-600 px-2 py-0.5 text-xs text-white hover:bg-cyan-700"
                    onClick={() =>
                      changeEventPublicStatus(event.id, !event.is_public)
                    }
                  >
                    {event.is_public ? "Spraviť súkromným" : "Zverejniť"}
                  </button>
                  <button
                    className="rounded-md border border-red-800 bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700"
                    onClick={() => {
                      if (event.tickets.length > 0) {
                        alert(
                          "Nemôžete vymazať termín, ktorý má predané lístky. Najprv vymažte lístky.",
                        );
                        return;
                      }
                      expanded.includes(event.id) &&
                        setExpanded(expanded.filter((e) => e != event.id));
                      deleteEvent(event.id);
                    }}
                  >
                    Vymazať
                  </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
