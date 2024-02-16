"use client";

import { MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useStoreContext } from "../store";
import {
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NewServiceModal from "./modals/NewServiceModal";
import { InstantTextField } from "@/utils/forms/FormElements";
import { deleteService, updateService, Services } from "./serverActions";
import Loading from "./loading";

function ServiceRow({ service }: { service: Services }) {
  const { eventsCount, setPartialService, removeService } = useStoreContext(
    (state) => ({
      eventsCount: state.events.allEvents.filter(
        (e) => e.service_id == service.id,
      ),
      ...state.services,
    }),
  );

  return (
    <li key={service.id}>
      <div className="flex items-center gap-4 py-1">
        <div className="basis-60 ">
          <InstantTextField
            defaultValue={service.name}
            setLocalValue={(v) =>
              setPartialService({ id: service.id, name: v || undefined })
            }
            updateDatabase={(v) =>
              updateService({ id: service.id, name: v || undefined })
            }
            type="text"
            // onBlur={() => setIsEditing(false)}
            showAlways={false}
            autoFocus
            inline
            trim
          />
        </div>
        <div className="w-12 flex-grow text-sm text-gray-500">
          Počet udalostí: {eventsCount.length}
        </div>
        <button
          className="transition-all hover:scale-110 hover:text-red-500"
          onClick={async () => {
            if (eventsCount.length > 0) {
              alert(
                "Nemôžete vymazať predstavenie, na ktoré existujú udalosti",
              );
              return;
            }
            if (!confirm("Naozaj chcete zmazať toto predstavenie?")) return;
            const r = await deleteService(service.id);
            if (!r.error) {
              removeService(service.id);
            }
          }}
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}

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
        <NewServiceModal />
      </div>
      {services.length > 0 ? (
        <ul>
          {services.map((service) => (
            <ServiceRow service={service} />
          ))}
        </ul>
      ) : isRefreshing ? (
        <Loading />
      ) : (
        <div className="flex flex-col items-center gap-2 p-10 text-sm text-gray-500">
          Namáte žiadne vytvorené predstavenia
          <NewServiceModal />
        </div>
      )}
    </>
  );
}
