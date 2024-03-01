"use client";

import { InstantTextField } from "@/utils/forms/FormElements_dep";
import { optimisticUpdate } from "@/utils/misc";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Header from "../components/Header";
import { useStoreContext } from "../store";
import NewServiceButton from "./edit/button";
import ServiceForm from "./edit/form";
import { Services, deleteService, updateService } from "./serverActions";

function ServiceRow({ service }: { service: Services }) {
  const { eventsCount, setPartialService, removeService, addServices } =
    useStoreContext((state) => ({
      eventsCount: state.events.allEvents.filter(
        (e) => e.service_id == service.id,
      ),
      ...state.services,
    }));

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
            pathname: "/dashboard/services/edit",
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
            optimisticUpdate({
              value: {},
              localUpdate: () => removeService(service.id),
              databaseUpdate: () => deleteService(service.id),
              localRevert: () => addServices([service]),
              confirmation: "Naozaj chcete zmazať toto predstavenie?",
              successMessage: "Predstavenie bolo vymazané",
              loadingMessage: "Vymazávam...",
            });
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
  }, [q, search]);

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
      ) : (
        <div className="flex flex-col items-center p-10">
          <RocketLaunchIcon className="w-12 text-gray-400" />
          <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
            Vytvorte si svoje prvé predstavenie
          </p>
          <div className="rounded-2xl border border-gray-200 p-4 shadow-md">
            <ServiceForm onSubmit={() => {}} />
          </div>
        </div>
      )}
    </>
  );
}
