"use client";

import { Modal } from "flowbite-react";
import { useState } from "react";
import { useStoreContext } from "../../store";
import NewTicketsButton from "../../events/new-tickets/button";
import EventRows from "../../events/_components/EventRow";

export default function UseCouponSelectEvent({
  couponCode,
}: {
  couponCode: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    events: { allEvents },
    services: { allServices },
  } = useStoreContext((state) => state);

  return (
    <>
      <button
        className="rounded-md bg-green-500 px-1.5 py-0.5 text-xs text-white hover:bg-green-600 active:bg-green-700"
        onClick={() => setIsOpen(true)}
      >
        Use
      </button>
      <Modal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        dismissible
        size={"4xl"}
      >
        <Modal.Header>
          Vyberte si udalosť, na ktorú by ste chceli predať lístky s týmto
          kupónom
        </Modal.Header>
        <Modal.Body>
          <EventRows
            events={allEvents}
            services={allServices}
            actionButton={(event) => (
              <NewTicketsButton
                eventId={event.id.toString()}
                couponCode={couponCode}
              />
            )}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
