"use client";

import InlineLoading from "@/components/InlineLoading";
import SubmitButton from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRxCollection, useRxData } from "@/rxdb/db";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useCallback, useState, useTransition } from "react";
import { toast } from "react-toastify";

export default function ConvertToCouponModal({
  selectedTickets,
}: {
  selectedTickets: TicketsDocument[];
}) {
  const [isSubmitting, startSubmition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);

  const { result: ticketTypes } = useRxData(
    "ticket_types",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            id: { $in: selectedTickets.map((t) => t.type_id) },
          },
        }),
      [selectedTickets],
    ),
  );

  const ticketsCollection = useRxCollection("tickets");
  const couponsCollection = useRxCollection("coupons");

  const submit = () => {
    if (!ticketsCollection || !couponsCollection) return;
    startSubmition(async () => {
      const amount = selectedTickets
        .map((t) => t.price)
        .reduce((a, b) => a + b, 0);
      const newCoupon = await couponsCollection.insert({
        id: crypto.randomUUID(),
        code: crypto.randomUUID().slice(0, 8).toUpperCase(),
        amount,
        original_amount: amount,
      });

      await ticketsCollection.bulkUpsert(
        selectedTickets.map((t) => ({
          ...t,
          payment_status: "zrušené",
          coupon_created_id: newCoupon.id,
        })),
      );

      toast.success("Lístky boli premenené na poukaz", {
        autoClose: 1500,
      });
      setIsOpen(false);
    });
  };

  return (
    <>
      <Button
        variant={"outline"}
        size={"xs"}
        onClick={() =>
          selectedTickets.length == 0
            ? alert("Zvoľte aspoň jeden lístok")
            : setIsOpen(true)
        }
      >
        Premeniť na poukaz
      </Button>
      <Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Naozaj chcete premeniť zvolené lístky na poukaz?
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <p className="p-2">Zvolené lístky:</p>
            {ticketTypes?.map((type) => (
              <div
                key={type.label}
                className="rounded-lg border border-gray-300 bg-slate-50 px-2 py-1"
              >
                <span className="font-semibold">{type.label}</span>:{" "}
                <span className="font-bold">
                  {selectedTickets.filter((t) => t.type_id == type.id).length}
                </span>{" "}
                lístkov
              </div>
            )) || <InlineLoading />}
          </div>
          <hr className="my-2" />
          <p className="flex items-center text-gray-700">
            <InformationCircleIcon className="me-2 h-4 w-4" />
            Zvolené lístky budú zrušené a vytvorí sa jeden poukaz v hodnote{" "}
            {selectedTickets.map((t) => t.price).reduce((a, b) => a + b, 0)}€
          </p>
          <form action={submit}>
            <SubmitButton
              submitting={isSubmitting}
              label="Potvrdiť"
              submittingLabel="Vytváram poukaz..."
              className="ms-auto"
            />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
