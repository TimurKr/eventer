"use client";

import { Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import NewTicketsForm from "../../../events/new-tickets/form";

export default function NewServiceModal({
  searchParams,
}: {
  searchParams: { eventId: string; couponCode?: string };
}) {
  const router = useRouter();

  if (!searchParams.eventId) return null;

  return (
    <>
      <Modal show={true} onClose={() => router.back()} dismissible size={"5xl"}>
        <Modal.Header>Vytvorte nové lístky</Modal.Header>
        <Modal.Body>
          <NewTicketsForm {...searchParams} />
        </Modal.Body>
      </Modal>
    </>
  );
}
