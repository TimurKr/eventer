"use client";

import { Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import EditEventForm, {
  type EditEventFormProps,
} from "@/app/dashboard/events/edit-event/form";

export default function NewServiceModal({
  searchParams,
}: {
  searchParams: EditEventFormProps;
}) {
  const router = useRouter();

  return (
    <>
      <Modal show={true} onClose={() => router.back()} dismissible>
        <Modal.Header>
          {searchParams.eventId ? "Upravte udalosť" : "Zvolťe nový termín"}
        </Modal.Header>
        <Modal.Body>
          <EditEventForm {...searchParams} />
        </Modal.Body>
      </Modal>
    </>
  );
}
