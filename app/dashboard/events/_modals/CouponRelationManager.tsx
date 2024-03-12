"use client";

import { useRxData } from "@/rxdb/db";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import {
  TicketIcon as TicketIconOutline,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { TicketIcon as TicketIconSolid } from "@heroicons/react/24/solid";
import { Tooltip } from "flowbite-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { validateCoupon } from "../../coupons/utils";
import CouponCodeField from "./CouponCodeField";

const idKey = {
  created: "coupon_created_id",
  redeemed: "coupon_redeemed_id",
} as const;

export default function CouponRelationManager({
  ticket,
  type,
}: {
  ticket: TicketsDocument;
  type: "created" | "redeemed";
}) {
  const [selectedCoupon, setSelectedCoupon] = useState<
    CouponsDocument | null | undefined
  >();

  const key = useMemo(() => idKey[type], [type]);

  useEffect(() => {
    if (selectedCoupon) {
      ticket.incrementalPatch({
        [key]: selectedCoupon.id,
      });
    }
  }, [key, selectedCoupon, ticket]);

  const { result: coupon, collection: couponsCollection } = useRxData(
    "coupons",
    useCallback(
      (collection) => collection.findOne(ticket[key] || "NOT ID"),
      [key, ticket],
    ),
  );

  return (
    <>
      <div className="flex items-center gap-2">
        {coupon ? (
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
                  query: { query: "=" + coupon.code },
                }}
              >
                <TicketIconSolid className="h-4 w-4 hover:scale-105" />
              </Link>
            </Tooltip>
            <button
              className="text-gray-500 hover:scale-105 hover:text-red-500 active:text-red-600"
              onClick={() => {
                if (
                  !confirm("Naozaj chcete vymazať prepojenie na tento poukaz?")
                )
                  return;
                ticket.incrementalPatch({
                  [key]: null,
                });
              }}
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </>
        ) : (
          (ticket.payment_status === "zrušené" || type === "redeemed") && (
            <div className="group relative">
              <div
                className={`absolute left-0 z-20 hidden -translate-x-full rounded-xl bg-gray-900 p-1 group-hover:block shadow-xl shadow-gray-400 has-[:focus]:block ${
                  type === "created" ? "top-0" : "bottom-0"
                }`}
              >
                <CouponCodeField
                  coupon={selectedCoupon}
                  setCoupon={setSelectedCoupon}
                  validate={async (code) => {
                    if (!couponsCollection) {
                      console.log("No collection");
                      return undefined;
                    }
                    const coupon = await couponsCollection
                      .findOne({ selector: { code } })
                      .exec();
                    if (coupon && validateCoupon(coupon)) {
                      return coupon;
                    }
                    return null;
                  }}
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
