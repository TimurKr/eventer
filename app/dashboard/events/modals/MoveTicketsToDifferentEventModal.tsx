"use client";

import { Alert, Badge, Modal, Progress, Spinner } from "flowbite-react";
import { useContext, useState, useTransition } from "react";
import { bulkUpdateTicketFields } from "../serverActions";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { Events, Tickets } from "@/utils/supabase/database.types";
import { useStore } from "zustand";
import { EventsContext } from "../zustand";
import { SubmitButton } from "@/app/components/FormElements";

export default function MoveTicketsToDifferentEventModal({
  eventId,
}: {
  eventId: Events["id"];
}) {
  const [isSubmitting, startSubmition] = useTransition();
  const [hoveringEvent, setHoveringEvent] = useState<Events | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  const store = useContext(EventsContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const { allEvents, ticketTypes, refresh } = useStore(store, (state) => state);
  const selectedTickets = useStore(store, (state) =>
    state.allEvents
      .find((e) => e.id === eventId)!
      .tickets.filter((t) => state.selectedTicketIds.includes(t.id)),
  );

  const submit = (selectedEventId: Events["id"]) => {
    startSubmition(async () => {
      bulkUpdateTicketFields(
        selectedTickets.map((t) => t.id),
        {
          event_id: selectedEventId,
        },
      );
      refresh();
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        className="rounded-md bg-cyan-600 px-2 py-0.5 text-xs text-white hover:bg-cyan-700 active:bg-cyan-800"
        onClick={() =>
          selectedTickets.length == 0
            ? alert("Zvolte aspoň jeden lístok")
            : setIsOpen(true)
        }
      >
        Posunúť na inú udalosť
      </button>
      <Modal show={isOpen} onClose={() => setIsOpen(false)} dismissible>
        <Modal.Header>
          Vyberte si udalosť, na ktorú by ste chceli presunúť lístky
        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-wrap gap-2">
            {ticketTypes.map((type) => (
              <div className="rounded-lg border border-gray-300 bg-slate-50 px-2 py-1">
                <span className="font-semibold">{type.label}</span>:{" "}
                <span className="font-bold">
                  {selectedTickets.filter((t) => t.type == type.label).length}
                </span>{" "}
                lístkov
              </div>
            ))}
            {isSubmitting && <Spinner />}
          </div>
          <hr className="my-2" />
          {allEvents.map((event) => (
            <button
              className={`my-0.5 flex w-full justify-between gap-x-6 rounded-md p-2 hover:bg-slate-100 ${
                event.id == eventId && "!bg-red-100"
              }`}
              disabled={event.id == eventId || isSubmitting}
              onMouseEnter={() => setHoveringEvent(event)}
              onMouseLeave={() => setHoveringEvent(null)}
              onClick={() => submit(event.id)}
            >
              <div className="flex min-w-0 flex-1 flex-col items-start self-center">
                <p className="flex items-center gap-4 font-semibold leading-6 text-gray-900">
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
              <div className="flex flex-col items-center justify-start lg:flex-row lg:gap-4">
                {ticketTypes.map((type) => {
                  const sold = event.tickets.filter(
                    (t) => t.type == type.label,
                  ).length;
                  const hoveringAdd =
                    hoveringEvent?.id == event.id && event.id != eventId
                      ? selectedTickets.filter((t) => t.type == type.label)
                          .length
                      : 0;
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
                            sold + hoveringAdd > type.max_sold
                              ? "text-red-600"
                              : sold + hoveringAdd == 0
                                ? "text-gray-400"
                                : ""
                          }`}
                        >
                          {hoveringAdd > 0 ? sold + hoveringAdd : sold}
                        </span>
                        /<span>{type.max_sold}</span>
                      </div>
                      <Progress
                        className="mb-1"
                        size="sm"
                        progress={Math.min(
                          ((sold + hoveringAdd) / type.max_sold) * 100,
                          100,
                        )}
                        color={
                          sold + hoveringAdd > type.max_sold
                            ? "failure"
                            : type.label == "VIP"
                              ? "yellow"
                              : "gray"
                        }
                        theme={{
                          bar: "transition-all rounded-full",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </button>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
}
