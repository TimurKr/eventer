"use client";

import NewCouponForm from "@/app/dashboard/coupons/new/form";
import { type EditEventFormProps } from "@/app/dashboard/events/edit-event/form";
import { Modal } from "flowbite-react";
import { useRouter } from "next/navigation";

export default function Page({
  searchParams,
}: {
  searchParams: EditEventFormProps;
}) {
  const router = useRouter();

  return (
    <>
      <Modal show={true} onClose={() => router.back()} dismissible>
        <Modal.Header>Vytvorte nový pokaz</Modal.Header>
        <Modal.Body>
          <NewCouponForm />
        </Modal.Body>
      </Modal>
    </>
  );
}
