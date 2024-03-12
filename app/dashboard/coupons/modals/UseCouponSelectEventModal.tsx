"use client";

import { useRxData } from "@/rxdb/db";
import InlineLoading from "@/utils/components/InlineLoading";
import { Modal } from "flowbite-react";
import { useState } from "react";
import EventRow from "../../events/_components/EventRow";
import NewTicketsButton from "../../events/new-tickets/button";

export default function UseCouponSelectEvent({
  couponCode,
}: {
  couponCode: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { result: allEvents, isFetching } = useRxData(
    "events",
    (collection) => collection.find(),
    { initialResult: [] },
  );

  return (
    <>
      <button
        className="rounded-md bg-green-500 px-1.5 py-0.5 text-xs text-white hover:bg-green-600 active:bg-green-700"
        onClick={() => setIsOpen(true)}
      >
        Použiť
      </button>
      <Modal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        dismissible
        size={"4xl"}
      >
        <Modal.Header>
          Vyberte si udalosť, na ktorú by ste chceli predať lístky s týmto
          poukazom
        </Modal.Header>
        <Modal.Body>
          {isFetching ? (
            <InlineLoading />
          ) : (
            allEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                actionButton={
                  <NewTicketsButton
                    eventId={event.id.toString()}
                    couponCode={couponCode}
                  />
                }
              />
            ))
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
