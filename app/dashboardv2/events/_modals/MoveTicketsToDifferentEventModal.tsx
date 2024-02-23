"use client";

import { Modal, Spinner } from "flowbite-react";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { useStoreContext } from "../../store_dep";
import EventRows from "../_components/EventRow";
import { bulkUpdateTicketFields } from "../serverActions";
import { Events } from "../store/helpers";

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
      await refresh();
      toast.success("Lístky boli presunuté na inú udalosť", {
        autoClose: 1500,
      });
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
              .filter(
                (value, index, self) =>
                  self.findIndex((v) => v.id === value.id) === index,
              )
              .map((type) => (
                <div
                  key={type.id}
                  className="rounded-lg border border-gray-300 bg-slate-50 px-2 py-1"
                >
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
          {
            <EventRows
              events={allEvents
                .filter((e) => e.service_id === event.service_id)
                .map((e) => ({
                  ...e,
                  tickets: e.tickets.concat(
                    e.id === hoveringEvent?.id && hoveringEvent?.id != event.id
                      ? selectedTickets
                      : [],
                  ),
                }))}
              className={
                hoveringEvent?.id == event.id
                  ? "cursor-not-allowed hover:!bg-red-100"
                  : ""
              }
              services={[service]}
              onClick={(e) => event.id != e.id && submit(e.id)}
              onMouseEnter={(e) => setHoveringEvent(e)}
              onMouseLeave={(e) => setHoveringEvent(null)}
            />
          }
        </Modal.Body>
      </Modal>
    </>
  );
}
