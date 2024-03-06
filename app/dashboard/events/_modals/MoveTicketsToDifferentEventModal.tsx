"use client";

import { useRxCollection, useRxData } from "@/rxdb/db";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import InlineLoading from "@/utils/components/InlineLoading";
import { Modal, Spinner } from "flowbite-react";
import { useCallback, useState, useTransition } from "react";
import { toast } from "react-toastify";
import EventRow from "../_components/EventRow";

export default function MoveTicketsToDifferentEventModal({
  selectedTickets,
}: {
  selectedTickets: TicketsDocument[];
}) {
  const [isSubmitting, startSubmition] = useTransition();
  const [hoveringEvent, setHoveringEvent] = useState<EventsDocument | null>(
    null,
  );

  const [isOpen, setIsOpen] = useState(false);

  const { result: allEvents } = useRxData(
    "events",
    useCallback((collection) => collection.find().sort("datetime"), []),
  );

  const { result: ticketTypes } = useRxData(
    "ticket_types",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            id: { $in: selectedTickets.map((t) => t.type_id) },
          },
        }),
      [selectedTickets],
    ),
  );

  const ticketsCollection = useRxCollection("tickets");

  const submit = (selectedEvent: EventsDocument) => {
    startSubmition(async () => {
      if (!ticketsCollection) return;
      await ticketsCollection.bulkUpsert(
        selectedTickets.map((t) => ({ ...t, event_id: selectedEvent.id })),
      );
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
            {ticketTypes?.map((type) => (
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
            )) || <InlineLoading />}
            {isSubmitting && <Spinner />}
          </div>
          <hr className="my-2" />
          {allEvents?.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onClick={(e) => event.id != e.id && submit(event)}
              onMouseEnter={(e) => setHoveringEvent(event)}
              onMouseLeave={(e) => setHoveringEvent(null)}
              className={
                hoveringEvent?.id == event.id
                  ? "cursor-not-allowed hover:!bg-red-100"
                  : ""
              }
            />
          )) || <InlineLoading />}
        </Modal.Body>
      </Modal>
    </>
  );
}
