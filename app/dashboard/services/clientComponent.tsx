"use client";

import { MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useStoreContext } from "../store";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Services() {
  const { services, searchTerm, search, refresh, isRefreshing } =
    useStoreContext((state) => state.services);

  const q = useSearchParams().get("query");
  useEffect(() => {
    if (q) search(q);
  }, []);

  return (
    <>
      <div className="sticky -top-2 z-20 flex items-start justify-between gap-4 bg-inherit py-2 pt-4">
        <span className="text-2xl font-bold tracking-wider">Predstavenia</span>
        <div className="relative ms-auto max-w-64 grow">
          <div className="pointer-events-none absolute left-0 top-0 grid h-full place-content-center px-2">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
          </div>
          {searchTerm && (
            <button
              onClick={() => search("")}
              className="absolute right-0 top-0 grid h-full place-content-center px-2 text-gray-400 hover:scale-105 hover:text-gray-500 active:text-gray-600"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          )}
          <div
            className={`absolute bottom-0.5 left-8 h-0 overflow-hidden text-xs text-gray-500 ${
              searchTerm ? "h-4" : ""
            } transition-all duration-300 ease-in-out`}
          >
            {services.length} výsledkov
          </div>
          <input
            type="text"
            className={`z-10 w-full rounded-md border-gray-200 bg-transparent px-8 py-0.5 ${
              searchTerm ? "pb-4" : ""
            } transition-all duration-300 ease-in-out`}
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
        {/* <NewEventModal /> */}
      </div>
      <ul>
        {services.map((service) => (
          <li key={service.id}>{service.name}</li>
        ))}
      </ul>
    </>
  );
}
