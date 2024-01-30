"use client";

import { useContext, useState } from "react";
import { Badge, Progress, Table } from "flowbite-react";
import { HiChevronDown } from "react-icons/hi2";
import NewTicketModal from "../NewTicketModal";
import { deleteEvent, updateEventPublicStatus } from "../serverActions";
import { toast } from "react-toastify";
import { EventsContext, createEventsStore } from "../zustand";
import { useStore } from "zustand";
import React from "react";
import TicketRows from "./TicketRows";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/solid";

export default function EventRow({ eventId }: { eventId: number }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showCancelled, setShowCancelled] = useState<boolean>(false);
  const [lockedArrived, setLockArrived] = useState<boolean>(true);

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
                  isExpanded || searchTerm ? "rotate-180 transform" : ""
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
                  <Table.HeadCell className="flex items-center gap-1 p-1">
                    <button
                      className="text-gray-500 hover:text-gray-600 active:text-gray-700"
                      onClick={() => setLockArrived(!lockedArrived)}
                    >
                      {lockedArrived ? (
                        <LockClosedIcon className="h-3 w-3" />
                      ) : (
                        <LockOpenIcon className="h-3 w-3" />
                      )}
                    </button>
                    Dorazil
                  </Table.HeadCell>
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
                  <Table.HeadCell className="p-1 text-center">
                    Poznámka
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-end">Cena</Table.HeadCell>
                  <Table.HeadCell className="p-1">
                    <span className="sr-only">Edit</span>
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  <TicketRows
                    eventId={eventId}
                    cancelled={false}
                    lockedArrived={lockedArrived}
                  />
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
                          eventId={eventId}
                          cancelled={true}
                          lockedArrived={lockedArrived}
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
