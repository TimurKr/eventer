"use client";

import InlineLoading from "@/components/InlineLoading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRxData } from "@/rxdb/db";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EventRow from "../../../../components/EventRow";

export default function UseCouponSelectEvent({
  coupon,
}: {
  coupon: CouponsDocument;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { result: allEvents, isFetching } = useRxData(
    "events",
    (collection) => collection.find().sort({ datetime: "desc" }),
    { initialResult: [] },
  );

  const router = useRouter();

  return (
    <>
      <button
        className="rounded-md bg-green-500 px-1.5 py-0.5 text-xs text-white hover:bg-green-600 active:bg-green-700"
        onClick={() => setIsOpen(true)}
      >
        Použiť
      </button>
      <Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Vyberte si udalosť, na ktorú by ste chceli predať lístky s týmto
              poukazom
            </DialogTitle>
          </DialogHeader>
          {isFetching ? (
            <InlineLoading />
          ) : (
            allEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onClick={() =>
                  router.push(
                    `/dashboard/events/new-tickets?eventId=${event.id.toString()}&couponCode=${coupon.code}`,
                  )
                }
              />
            ))
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
