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
import NewServiceModal from "./new-service/Form";
import { InstantTextField } from "@/utils/forms/FormElements";
import { deleteService, updateService, Services } from "./serverActions";
import Loading from "./loading";
import NewServiceButton from "./new-service/Button";
import Link from "next/link";
import Header from "../components/Header";

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
        <div>
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
        <div className="me-4 ms-auto text-xs text-gray-500">
          <p>Typy lístkov: {service.ticket_types.length}</p>
          <p>Počet udalostí: {eventsCount.length}</p>
        </div>
        <Link
          href={{
            pathname: "/dashboard/services/new-service",
            query: { serviceId: service.id },
          }}
        >
          <PencilIcon className="h-5 w-5" />
        </Link>
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
      <Header
        title="Predstavenia"
        refresh={{ refresh, isRefreshing }}
        search={{ search, searchTerm, results: services.length }}
        actionButton={<NewServiceButton />}
      />
      {services.length > 0 ? (
        <ul>
          {services.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </ul>
      ) : isRefreshing ? (
        <Loading />
      ) : (
        <div className="flex flex-col items-center gap-2 p-10 text-sm text-gray-500">
          Namáte žiadne vytvorené predstavenia
          <NewServiceButton />
        </div>
      )}
    </>
  );
}
