"use client";

import { Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import NewServiceForm from "../../new-service/Form";
import { useStoreContext } from "@/app/dashboard/store";

export default function NewServiceModal({
  searchParams,
}: {
  searchParams: { serviceId?: string };
}) {
  const router = useRouter();

  return (
    <>
      <Modal show={true} onClose={() => router.back()} dismissible>
        <Modal.Header>
          {searchParams.serviceId
            ? "Upraviť predstavenie"
            : "Vytvorte si nové predstavenie"}
        </Modal.Header>
        <Modal.Body>
          <NewServiceForm serviceId={searchParams.serviceId} />
        </Modal.Body>
      </Modal>
    </>
  );
}
