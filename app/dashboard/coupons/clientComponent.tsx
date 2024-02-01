"use client";

import { useRef } from "react";
import { CouponsContext, createCouponsStore } from "./zustand";
import { useStore } from "zustand";
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { type Coupons } from "./serverActions";
import NewCouponModal from "./NewCouponModal";

export default function Coupons({ coupons }: { coupons: Coupons[] }) {
  const store = useRef(
    createCouponsStore({
      allCoupons: coupons,
      coupons,
    }),
  ).current;

  const { searchTerm, isRefreshing, search, refresh } = useStore(
    store,
    (s) => s,
  );
  return (
    <CouponsContext.Provider value={store}>
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
    </CouponsContext.Provider>
  );
}
