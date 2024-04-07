"use client";

import InlineLoading from "@/components/InlineLoading";
import Loading from "@/components/Loading";
import { InstantTextField } from "@/components/inputs/InstantFields";
import { useRxData } from "@/rxdb/db";
import { ServicesDocument } from "@/rxdb/schemas/public/services";
import { PencilIcon } from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import Fuse from "fuse.js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import Header from "../../../components/Header";
import NewServiceButton from "./edit/button";
import ServiceForm from "./edit/form";

function ServiceRow({ service }: { service: ServicesDocument }) {
  const { result: events } = useRxData(
    "events",
    useCallback(
      (collection) => collection.find().where("service_id").eq(service.id),
      [service.id],
    ),
  );

  const { result: ticketTypes } = useRxData(
    "ticket_types",
    useCallback(
      (collection) => collection.find().where("service_id").eq(service.id),
      [service.id],
    ),
  );

  return (
    <li key={service.id}>
      <div className="flex items-center gap-4 px-2 py-1">
        <div>
          <InstantTextField
            defaultValue={service.name}
            updateValue={async (name) =>
              (await service.incrementalPatch({ name: name || undefined })).name
            }
            type="text"
            showAlways={false}
            autoFocus
            inline
            trim
          />
        </div>
        <div className="me-4 ms-auto text-xs text-gray-500">
          {events ? <p>Počet udalostí: {events?.length}</p> : <InlineLoading />}
          {events ? (
            <p>Typy lístkov: {ticketTypes?.length}</p>
          ) : (
            <InlineLoading />
          )}
        </div>
        <Link
          href={{
            pathname: "/dashboard/services/edit",
            query: { serviceId: service.id },
          }}
        >
          <PencilIcon className="h-5 w-5" />
        </Link>
      </div>
    </li>
  );
}

export default function Page() {
  const q = useSearchParams().get("query");
  const [query, search] = useState(q || "");

  const { result: allServices, isFetching } = useRxData(
    "services",
    useCallback((collection) => collection.find().sort({ name: "asc" }), []),
  );

  const services = useMemo(() => {
    if (!allServices || allServices.length === 0) return [];

    if (!query) return allServices;

    const fuse = new Fuse(allServices, {
      keys: ["name"],
    });
    return fuse.search(query).map((result) => result.item);
  }, [allServices, query]);

  return (
    <>
      <Header
        title="Predstavenia"
        refresh={{ isRefreshing: isFetching }}
        search={{ search, query, resultsCount: services.length }}
        actionButton={<NewServiceButton />}
      />
      <div className="p-4 pt-0">
        {services.length > 0 ? (
          <ol className="">
            {services.map((service, index) => (
              <React.Fragment key={service.id}>
                {index > 0 && <hr className="my-2" />}
                <ServiceRow key={service.id} service={service} />
              </React.Fragment>
            ))}
          </ol>
        ) : isFetching ? (
          <Loading text="Načítavam predstavenia..." />
        ) : (
          <div className="flex flex-col items-center p-10">
            <RocketLaunchIcon className="w-12 text-gray-400" />
            <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
              {!allServices || allServices.length === 0
                ? "Vytvorte si svoje prvé predstavenie"
                : "Takéto predstavenie neexistuje, chcete si také vyrobiť?"}
            </p>
            <div className="rounded-2xl border border-gray-200 p-4 shadow-md">
              <ServiceForm onSubmit={() => {}} initialTitle={query} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
