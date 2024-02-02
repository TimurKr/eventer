"use client";

import { useRef } from "react";
import { CouponsContext, createCouponsStore } from "./zustand";
import { useStore } from "zustand";
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { type Coupons } from "./serverActions";
import NewCouponModal from "./modals/NewCouponModal";
import {
  ArrowTopRightOnSquareIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "flowbite-react";
import Link from "next/link";

export default function Coupons({
  defaultCoupons,
}: {
  defaultCoupons: Coupons[];
}) {
  const store = useRef(
    createCouponsStore({
      allCoupons: defaultCoupons,
      coupons: defaultCoupons,
    }),
  ).current;

  const { coupons, searchTerm, isRefreshing, search, refresh } = useStore(
    store,
    (s) => s,
  );
  return (
    <CouponsContext.Provider value={store}>
      <div>
        <div className="flex items-center justify-between gap-4 pb-2">
          <span className="text-2xl font-bold tracking-wider">Kupóny</span>
          <div className="relative ms-auto max-w-64 grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 grid place-content-center">
              <MagnifyingGlassIcon className="h-8 w-8 p-2 text-gray-500" />
            </div>
            <input
              type="text"
              className="z-10 w-full rounded-md border-gray-200 bg-transparent py-0.5 ps-8"
              placeholder="Hladať"
              value={searchTerm}
              onChange={(e) => search(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == "Escape") {
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key == "Enter") {
                  search(searchTerm);
                }
              }}
            />
          </div>
          <button
            className="flex items-center gap-2 rounded-md border border-gray-200 p-1 px-2 text-sm font-normal hover:bg-gray-100"
            onClick={refresh}
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${isRefreshing && "animate-spin"}`}
            />
            Obnoviť
          </button>
          <NewCouponModal />
        </div>
        <div>
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-200 *:py-0.5 first:*:rounded-tl-lg last:*:rounded-tr-lg">
                <th className="px-2 text-start text-sm font-semibold">Kód</th>
                <th className="text-end text-sm font-semibold">Suma</th>
                <th className="text-end text-sm font-semibold">Platnosť</th>
                <th className="text-center text-sm font-semibold">Stav</th>
                <th className="pe-2 text-end text-sm font-semibold">
                  Použité na:
                </th>
                <th className="pe-2 text-end text-sm font-semibold">
                  Vytvorené z:
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t first:border-none">
                  <td className="p-1 px-2">{coupon.code}</td>
                  <td className="text-end">
                    <span className="font-medium">{coupon.amount}</span> /{" "}
                    {coupon.original_amount} €
                  </td>
                  <td className="text-end">
                    {coupon.valid_until
                      ? new Date(coupon.valid_until).toLocaleDateString(
                          "sk-SK",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )
                      : "-"}
                  </td>
                  <td className="text-center">
                    {coupon.amount === 0 ||
                    (coupon.valid_until &&
                      new Date(coupon.valid_until) <=
                        new Date(new Date().toLocaleDateString())) ? (
                      <div className="mx-auto w-fit">
                        <Badge color="failure" className="w-fit">
                          Neplatné
                        </Badge>
                      </div>
                    ) : (
                      <div className="mx-auto w-fit">
                        <Badge color="success">Platné</Badge>
                      </div>
                    )}
                  </td>
                  <td>
                    {coupon.redeemed_from.length > 0 ? (
                      <div className="flex w-full items-center justify-end gap-2 px-2 text-end">
                        {coupon.redeemed_from.length}-krát
                        <Link
                          href={{
                            pathname: "/dashboard/events",
                            query: {
                              query:
                                "=" +
                                coupon.redeemed_from
                                  .map((t) => t.id)
                                  .join("|="),
                            },
                          }}
                        >
                          <ArrowTopRightOnSquareIcon className="ms-auto h-6 w-6 p-1 hover:scale-105 hover:cursor-pointer active:scale-110" />
                        </Link>
                      </div>
                    ) : (
                      <p className="px-2 text-end text-gray-600">-</p>
                    )}
                  </td>
                  <td>
                    {coupon.created_from.length > 0 ? (
                      <div className="flex w-full items-center justify-end gap-2 px-2 text-end">
                        {coupon.created_from.length}-krát
                        <Link
                          href={{
                            pathname: "/dashboard/events",
                            query: {
                              query:
                                "=" +
                                coupon.created_from.map((t) => t.id).join("|="),
                            },
                          }}
                        >
                          <ArrowTopRightOnSquareIcon className="ms-auto h-6 w-6 p-1 hover:scale-105 hover:cursor-pointer active:scale-110" />
                        </Link>
                      </div>
                    ) : (
                      <p className="px-2 text-end text-gray-600">-</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CouponsContext.Provider>
  );
}
