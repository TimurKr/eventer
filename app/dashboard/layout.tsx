"use client";

import { DbProvider, useRxData } from "@/rxdb/db";
import { InstantTextField } from "@/utils/forms/InstantFields";
import { useBrowserUser } from "@/utils/supabase/browser";
import React, { useCallback } from "react";
import { Id, toast } from "react-toastify";
import Navbar from "./Navbar";

function BusinessTitle() {
  const user = useBrowserUser();

  const { result: business } = useRxData(
    "businesses",
    useCallback(
      (collection) => collection.findOne(user?.id || "Not an ID"),
      [user],
    ),
  );

  return (
    <InstantTextField
      defaultValue={business?.name || ""}
      placeholder="Názov podniku"
      type="text"
      updateValue={(name) => business?.incrementalPatch({ name: name || "" })}
      inline
      showAlways={false}
      trim
    />
  );
}

export default function DashboardLayout({
  children,
  modals,
}: {
  children: React.ReactNode;
  modals: React.ReactNode;
}) {
  const offlineToastId = React.useRef<Id>();
  const handleOffline = useCallback(
    () =>
      (offlineToastId.current = toast.warn(
        "Nie ste pripojený na internet. Vaše zmeny nemusia byť uložené!",
        { autoClose: false },
      )),
    [],
  );
  const handleOnline = useCallback(() => {
    toast.update(offlineToastId.current!, {
      render: "Pripojený!",
      type: "success",
      autoClose: 1500,
    });
  }, []);

  return (
    <DbProvider handleOffline={handleOffline} handleOnline={handleOnline}>
      <section className="flex h-screen w-full flex-col justify-start bg-stone-300 p-2 gap-2">
        <nav className="top-0 z-30 flex flex-none flex-row items-center gap-1 bg-inherit p-2 bg-stone-50 rounded-lg shadow-md">
          <div className="hidden px-4 text-lg font-bold tracking-wider md:inline">
            <BusinessTitle />
          </div>
          <Navbar />
        </nav>
        <div className="grow shadow-md rounded-lg  h-full bg-stone-50 pt-0 overflow-scroll">
          {children}
          {modals}
        </div>
      </section>
    </DbProvider>
  );
}
