"use client";

import { Badge, Modal, Progress, Spinner } from "flowbite-react";
import { useState, useTransition } from "react";
import { bulkUpdateTicketFields } from "../serverActions";
import { useStoreContext } from "../../store";
import { Events } from "../store";

export default function MoveTicketsToDifferentEventModal({
  event,
}: {
  event: Events;
}) {
  const [isSubmitting, startSubmition] = useTransition();
  const [hoveringEvent, setHoveringEvent] = useState<Events | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  const { allEvents, refresh, selectedTickets, service } = useStoreContext(
    (state) => ({
      ...state.events,
      selectedTickets: state.events.allEvents
        .find((e) => e.id === event.id)!
        .tickets.filter((t) => state.events.selectedTicketIds.includes(t.id)),
      service: state.services.allServices.find(
        (s) => s.id === event.service_id,
      )!,
    }),
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
            {selectedTickets
              .map((t) => t.type)
              .filter((value, index, self) => self.indexOf(value) === index)
              .map((type) => (
                <div className="rounded-lg border border-gray-300 bg-slate-50 px-2 py-1">
                  <span className="font-semibold">{type.label}</span>:{" "}
                  <span className="font-bold">
                    {selectedTickets.filter((t) => t.type_id == type.id).length}
                  </span>{" "}
                  lístkov
                </div>
              ))}
            {isSubmitting && <Spinner />}
          </div>
          <hr className="my-2" />
          {allEvents
            .filter((e) => e.service_id === event.service_id)
            .map((e) => (
              <button
                key={e.id}
                className={`my-0.5 flex w-full justify-between gap-x-6 rounded-md p-2 hover:bg-slate-100 ${
                  e.id == event.id && "!bg-red-100"
                }`}
                disabled={e.id == event.id || isSubmitting}
                onMouseEnter={() => setHoveringEvent(e)}
                onMouseLeave={() => setHoveringEvent(null)}
                onClick={() => submit(e.id)}
              >
                <div className="flex min-w-0 flex-col items-start self-center">
                  <p className="flex items-center gap-4 font-semibold leading-6 text-gray-900">
                    {new Date(e.datetime).toLocaleDateString("sk-SK")}
                    <Badge
                      color={e.is_public ? "blue" : "purple"}
                      className="rounded-md"
                    >
                      {e.is_public ? "Verejné" : "Súkromné"}
                    </Badge>
                  </p>
                  <p className="truncate text-xs leading-5 text-gray-500">
                    {new Date(e.datetime).toLocaleTimeString("sk-SK")}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-start lg:flex-row lg:gap-4">
                  {service.ticket_types.map((type) => {
                    const sold = e.tickets.filter(
                      (t) => t.type_id == type.id,
                    ).length;
                    const hoveringAdd =
                      hoveringEvent?.id == e.id && e.id != event.id
                        ? selectedTickets.filter((t) => t.type_id == type.id)
                            .length
                        : 0;
                    return (
                      <div key={type.label} className="w-28">
                        <div
                          className={`flex items-end text-sm ${
                            type.is_vip ? "text-amber-600" : "text-gray-600"
                          }`}
                        >
                          <span className="font-medium">{type.label}</span>
                          <span
                            className={`ms-auto text-base font-bold ${
                              type.capacity &&
                              sold + hoveringAdd > type.capacity
                                ? "text-red-600"
                                : sold + hoveringAdd == 0
                                  ? "text-gray-400"
                                  : ""
                            }`}
                          >
                            {hoveringAdd > 0 ? sold + hoveringAdd : sold}
                          </span>
                          /<span>{type.capacity || "-"}</span>
                        </div>
                        <Progress
                          className="mb-1"
                          size="sm"
                          progress={Math.min(
                            type.capacity
                              ? ((sold + hoveringAdd) / type.capacity) * 100
                              : 0,
                            100,
                          )}
                          color={
                            type.capacity && sold + hoveringAdd > type.capacity
                              ? "failure"
                              : type.is_vip
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
