"use client";

import { Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useStoreContext } from "@/app/dashboard/store";
import NewTicketsForm from "../../../events/new-tickets/form";
import EditDateForm from "@/app/dashboard/events/edit-date/form";

export default function NewServiceModal({
  searchParams,
}: {
  searchParams: { eventId: string };
}) {
  const router = useRouter();

  if (!searchParams.eventId) return null;

  return (
    <>
      <Modal show={true} onClose={() => router.back()} dismissible>
        <Modal.Header>Zvolťe nový termín</Modal.Header>
        <Modal.Body>
          <EditDateForm {...searchParams} />
        </Modal.Body>
      </Modal>
    </>
  );
}
