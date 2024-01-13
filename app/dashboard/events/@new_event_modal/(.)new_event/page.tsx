"use client";

import { useRouter } from "next/navigation";
import NewEventForm from "../../new_event/NewEventForm";
import { Modal } from "flowbite-react";

export default function ModalForm(createNewDate: any) {
  const router = useRouter();

  return (
    <Modal
      show={true}
      onClose={() => router.back()}
      title="Nový termín"
      dismissible
    >
      <Modal.Header>Nový termín</Modal.Header>
      <Modal.Body>
        <NewEventForm />
      </Modal.Body>
    </Modal>
  );
}
