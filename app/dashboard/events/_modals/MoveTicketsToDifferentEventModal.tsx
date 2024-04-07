"use client";

import InlineLoading from "@/components/InlineLoading";
import NoResults from "@/components/NoResults";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRxCollection, useRxData } from "@/rxdb/db";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCallback, useState, useTransition } from "react";
import { toast } from "react-toastify";
import EventRow from "../../../../components/EventRow";

export default function MoveTicketsToDifferentEventModal({
  selectedTickets,
  originalEvent,
}: {
  selectedTickets: TicketsDocument[];
  originalEvent: EventsDocument;
}) {
  const [isSubmitting, startSubmition] = useTransition();
  const [hoveringEvent, setHoveringEvent] = useState<EventsDocument | null>(
    null,
  );

  const [isOpen, setIsOpen] = useState(false);

  const { result: allEvents } = useRxData(
    "events",
    useCallback(
      (collection) =>
        collection.find({
          selector: { service_id: { $eq: originalEvent.service_id } },
          sort: [{ datetime: "desc" }],
        }),
      [originalEvent.service_id],
    ),
    { initialResult: [] },
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
        selectedTickets.map((t) => ({
          ...t._data,
          event_id: selectedEvent.id,
        })),
      );
      toast.success("Lístky boli presunuté na inú udalosť", {
        autoClose: 1500,
      });
      setIsOpen(false);
    });
  };

  return (
    <>
      <Button
        variant={"outline"}
        size={"xs"}
        onClick={() =>
          selectedTickets.length == 0
            ? alert("Zvoľte aspoň jeden lístok")
            : setIsOpen(true)
        }
      >
        Posunúť na inú udalosť
      </Button>
      <Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
        <DialogContent size="4xl">
          <DialogHeader>
            <DialogTitle>
              Vyberte si udalosť, na ktorú by ste chceli presunúť lístky
            </DialogTitle>
          </DialogHeader>
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
            {isSubmitting && <ArrowPathIcon className="h-4 w-4" />}
          </div>
          <hr className="my-2" />
          <div className="flex flex-col gap-2">
            {allEvents?.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onClick={() =>
                  !selectedTickets.some((t) => t.event_id == event.id) &&
                  submit(event)
                }
                onMouseEnter={() => setHoveringEvent(event)}
                onMouseLeave={() => setHoveringEvent(null)}
                className={cn(
                  "rounded-lg",
                  selectedTickets.some((t) => t.event_id == event.id) &&
                    "cursor-not-allowed !bg-red-50",
                )}
                additionalTickets={
                  !selectedTickets.some((t) => t.event_id == event.id) &&
                  hoveringEvent?.id === event.id
                    ? selectedTickets.filter(
                        (t) => t.payment_status !== "zrušené",
                      )
                    : []
                }
              />
            )) || <InlineLoading />}
            {allEvents?.length === 0 && (
              <NoResults text="Nemáte žiadne udalosti." />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
