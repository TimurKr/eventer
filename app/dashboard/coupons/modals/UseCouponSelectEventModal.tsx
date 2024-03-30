"use client";

import InlineLoading from "@/components/InlineLoading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRxData } from "@/rxdb/db";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import { useRouter } from "next/navigation";
import EventRow from "../../../../components/EventRow";

export default function UseCouponSelectEvent({
  coupon,
}: {
  coupon: CouponsDocument;
}) {
  const { result: allEvents, isFetching } = useRxData(
    "events",
    (collection) => collection.find().sort({ datetime: "desc" }),
    { initialResult: [] },
  );

  const router = useRouter();

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <button className="rounded-md bg-green-600 px-1.5 py-0.5 text-xs text-white hover:bg-green-700 active:bg-green-800">
            Použiť
          </button>
        </DialogTrigger>
        <DialogContent size="4xl">
          <DialogHeader>
            <DialogTitle>
              Vyberte si udalosť, na ktorú by ste chceli predať lístky s týmto
              poukazom
            </DialogTitle>
          </DialogHeader>
          {isFetching ? (
            <InlineLoading />
          ) : (
            <div className="flex flex-col">
              {allEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  className="rounded-md"
                  onClick={() =>
                    router.push(
                      `/dashboard/events/new-tickets?eventId=${event.id.toString()}&couponCode=${coupon.code}`,
                    )
                  }
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
