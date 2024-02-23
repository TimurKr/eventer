"use client";

import { optimisticUpdate } from "@/utils/misc";
import { Coupons } from "@/utils/supabase/database.types";
import {
  TicketIcon as TicketIconOutline,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { TicketIcon as TicketIconSolid } from "@heroicons/react/24/solid";
import { Tooltip } from "flowbite-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStoreContext } from "../../store_dep";
import {
  EventWithTickets,
  fetchCoupon,
  updateTicketFields,
} from "../serverActions";
import CouponCodeField from "./CouponCodeField";

export default function CouponRelationManager({
  ticket,
  type,
}: {
  ticket: EventWithTickets["tickets"][0];
  type: "created" | "redeemed";
}) {
  const [selectedCoupon, setSelectedCoupon] = useState<
    Coupons | null | undefined
  >();

  const { setPartialTicket } = useStoreContext((state) => state.events);

  const objectKey = type === "created" ? "coupon_created" : "coupon_redeemed";
  const idKey = type === "created" ? "coupon_created_id" : "coupon_redeemed_id";

  useEffect(() => {
    if (selectedCoupon) {
      optimisticUpdate({
        value: {},
        localUpdate: () =>
          setPartialTicket({
            id: ticket.id,
            [idKey]: selectedCoupon.id,
            [objectKey]: selectedCoupon,
          }),
        databaseUpdate: async () =>
          updateTicketFields({
            id: ticket.id,
            [idKey]: selectedCoupon.id,
          }),
        localRevert: () => setPartialTicket(ticket),
      });
    }
  }, [selectedCoupon]);

  return (
    <>
      <div className="flex items-center gap-2">
        {ticket[objectKey] ? (
          <>
            <Tooltip
              content={
                type === "created"
                  ? "Lístok bol premenený na poukaz, kliknutím zobrazíte"
                  : "Na kúpu bol použitý poukaz, kliknutím zobrazíte"
              }
              placement="left"
            >
              <Link
                className={`${
                  type === "created"
                    ? "text-red-500 active:text-red-600"
                    : "text-green-500 active:text-green-600"
                }`}
                href={{
                  pathname: "/dashboard/coupons",
                  query: { query: "=" + ticket[objectKey]!.code },
                }}
              >
                <TicketIconSolid className="h-4 w-4 hover:scale-105" />
              </Link>
            </Tooltip>
            <button
              className="text-gray-500 hover:scale-105 hover:text-red-500 active:text-red-600"
              onClick={() =>
                optimisticUpdate({
                  value: {},
                  localUpdate: () =>
                    setPartialTicket({
                      id: ticket.id,
                      [objectKey]: null,
                      [idKey]: null,
                    }),
                  databaseUpdate: async () =>
                    updateTicketFields({
                      id: ticket.id,
                      [idKey]: null,
                    }),
                  localRevert: () => setPartialTicket(ticket),
                  confirmation:
                    "Naozaj chcete vymazať prepojenie na tento poukaz?",
                })
              }
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </>
        ) : (
          (ticket.payment_status === "zrušené" || type === "redeemed") && (
            <div className="group relative">
              <div
                className={`absolute left-0 z-20 hidden -translate-x-full rounded-xl bg-gray-900  p-1 group-hover:block has-[:focus]:block ${
                  type === "created" ? "top-0" : "bottom-0"
                }`}
              >
                <CouponCodeField
                  coupon={selectedCoupon}
                  setCoupon={setSelectedCoupon}
                  validate={async (code) => fetchCoupon(code)}
                />
              </div>
              <TicketIconOutline
                className={`h-4 w-4 text-gray-500 group-focus-within:scale-105 group-hover:scale-105 ${
                  type === "created"
                    ? "group-focus-within:text-red-500 group-hover:text-red-500"
                    : "group-focus-within:text-green-500 group-hover:text-green-500"
                }`}
              />
            </div>
          )
        )}
      </div>
    </>
  );
}
