"use client";

import { Events, Tickets } from "@/utils/supabase/database.types";
import { Button, Modal } from "flowbite-react";
import { useState } from "react";

export default function NewTicketModal({
  event,
}: {
  event: Events & { tickets: Tickets[] };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="rounded-md border border-green-500 bg-green-200 px-2 py-1 text-xs text-green-600 hover:bg-green-300"
        onClick={() => setIsOpen(true)}
      >
        Predať lístok
      </button>
      <Modal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nový lístok"
        dismissible
      >
        <Modal.Header>Nový lístok</Modal.Header>
        <Modal.Body>Vytvor</Modal.Body>
      </Modal>
    </>
  );
}
