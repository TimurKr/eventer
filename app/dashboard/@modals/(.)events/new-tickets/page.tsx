"use client";

import { Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import NewTicketsForm from "../../../events/new-tickets/form";

export default function NewServiceModal() {
  const router = useRouter();

  // if (!searchParams.eventId) {
  //   router.replace("/dashboard/events");
  //   return null;
  // }

  return (
    <>
      <Modal show={true} onClose={() => router.back()} dismissible size={"5xl"}>
        <Modal.Header>Vytvorte nové lístky</Modal.Header>
        <Modal.Body>
          <NewTicketsForm />
        </Modal.Body>
      </Modal>
    </>
  );
}
