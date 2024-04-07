"use client";

import InlineLoading from "@/components/InlineLoading";
import { InstantTextField } from "@/components/inputs/InstantFields";
import { useUser } from "@/lib/supabase/browser";
import { DbProvider, useRxData } from "@/rxdb/db";
import React, { useCallback } from "react";
import { Id, toast } from "react-toastify";
import Navbar from "./Navbar";

function BusinessTitle() {
  const { user } = useUser();

  const { result: business, isFetching } = useRxData(
    "businesses",
    useCallback(
      (collection) => collection.findOne(user?.id || "Not an ID"),
      [user],
    ),
    { hold: !user },
  );

  if (isFetching) return <InlineLoading />;

  if (!business) {
    console.error("No business found... Probably hasn't been fetched yet.");
    return null;
  }

  return (
    <InstantTextField
      defaultValue={business.name || ""}
      placeholder="Názov podniku"
      type="text"
      updateValue={async (name) =>
        (await business.incrementalPatch({ name: name || "" })).name || ""
      }
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
      <section className="flex h-screen w-full flex-col justify-start gap-2 bg-zinc-300 p-2">
        <nav className="top-0 z-30 flex flex-none flex-row items-center gap-1 rounded-lg bg-background p-2 shadow-md">
          <div className="hidden min-w-40 px-4 text-lg font-bold tracking-wider transition-all md:inline">
            <BusinessTitle />
          </div>
          <Navbar />
        </nav>
        <div className="h-full grow overflow-auto rounded-lg bg-background pt-0 shadow-md">
          {children}
          {modals}
        </div>
      </section>
    </DbProvider>
  );
}
