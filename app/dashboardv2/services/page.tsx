"use client";

import { ServicesDocument } from "@/rxdb/schemas/public/services";
import { InstantTextField } from "@/utils/forms/FormElements";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import Fuse from "fuse.js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useRxData } from "rxdb-hooks";
import Header from "../components/Header";
import { Tables } from "../utils/supabase/database.types";
import NewServiceButton from "./edit/button";
import ServiceForm from "./edit/form";

function ServiceRow({ service }: { service: ServicesDocument }) {
  // const { result: events, isFetching } = useRxData<Tables<"events">>(
  //   "events",
  //   useCallback(
  //     (collection) => collection.find().where("service_id").eq(service.id),
  //     [service.id],
  //   ),
  // );

  const events = [];

  return (
    <li key={service.id}>
      <div className="flex items-center gap-4 py-1">
        <div>
          <InstantTextField
            defaultValue={service.name}
            updateValue={async (name) => await service.patch({ name })}
            type="text"
            showAlways={false}
            autoFocus
            inline
            trim
          />
        </div>
        <div className="me-4 ms-auto text-xs text-gray-500">
          <p>Počet udalostí: {events.length}</p>
        </div>
        <Link
          href={{
            pathname: "/dashboardv2/services/edit",
            query: { serviceId: service.id },
          }}
        >
          <PencilIcon className="h-5 w-5" />
        </Link>
        <button
          className="transition-all hover:scale-110 hover:text-red-500"
          onClick={async () => {
            if (events.length > 0) {
              console.log(
                "Nemôžete vymazať predstavenie, ktoré už má udalosti. Vymažte najprv udalosti.",
              );
              return;
            }
            await service.remove();
          }}
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}

export default function Page() {
  const q = useSearchParams().get("query");
  const [searchTerm, search] = useState(q || "");

  const { result: allServices, isFetching } = useRxData<Tables<"services">>(
    "services",
    useCallback((collection) => {
      console.log("using collection builder", collection);
      return collection.find();
    }, []),
  );

  // const db = useRxDB();
  // const [allServices, setAllServices] = useState<ServicesDocument[]>([]);
  // useEffect(() => {
  //   if (!db) return;
  //   const myCollection = db.services;
  //   myCollection.find({}).$.subscribe((documents) => {
  //     console.log("query has found " + documents.length + " documents");
  //     console.log(documents);
  //   });
  // .$.subscribe((services) => {
  //   setAllServices(services);
  // });
  // return () => sub?.unsubscribe();
  // }, [db]);

  const services = useMemo(() => {
    if (!allServices || allServices.length === 0) return [];

    if (!searchTerm) return allServices;

    const fuse = new Fuse(allServices, {
      keys: ["name"],
    });
    return fuse.search(searchTerm).map((result) => result.item);
  }, [allServices, searchTerm]);

  return (
    <>
      <Header
        title="Predstavenia"
        refresh={{ isRefreshing: isFetching }}
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
            {!allServices || allServices.length === 0
              ? "Vytvorte si svoje prvé predstavenie"
              : "Takéto predstavenie neexistuje, chcete si také vyrobiť?"}
          </p>
          <div className="rounded-2xl border border-gray-200 p-4 shadow-md">
            {/* TODO: Autofil the searchTerm */}
            <ServiceForm onSubmit={() => {}} initialTitle={searchTerm} />
          </div>
        </div>
      )}
    </>
  );
}
