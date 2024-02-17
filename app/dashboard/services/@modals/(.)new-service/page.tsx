"use client";

import { Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import NewServicePage from "../../new-service/Form";

export default function NewServiceModal() {
  const router = useRouter();

  return (
    <>
      <Modal show={true} onClose={() => router.back()} dismissible>
        <Modal.Header>Vytvorte si nové predstavenie</Modal.Header>
        <Modal.Body>
          <NewServicePage />
        </Modal.Body>
      </Modal>
    </>
  );
}
