"use client";

import { DbProvider, useRxData } from "@/rxdb/db";
import { InstantTextField } from "@/utils/forms/InstantFields";
import { getBrowserUser } from "@/utils/supabase/browser";
import { User } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useState } from "react";
import { Id, toast } from "react-toastify";
import Navbar from "./Navbar";

function BusinessTitle() {
  const [user, setUser] = useState<User | null>(null);
  const { result: business } = useRxData(
    "businesses",
    useCallback(
      (collection) => collection.findOne(user?.id || "Not an ID"),
      [user],
    ),
  );

  useEffect(() => {
    getBrowserUser().then((user) => setUser(user));
  }, []);

  return (
    <InstantTextField
      defaultValue={business?.name || ""}
      placeholder="Názov podniku"
      type="text"
      updateValue={(name) => business?.patch({ name: name || "" })}
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
      <section className="flex h-screen w-full flex-col justify-start bg-slate-200">
        <nav className="auto top-0 z-30 flex flex-none flex-row items-center gap-1 bg-inherit p-2 shadow-md">
          <div className="hidden px-4 text-lg font-bold tracking-wider md:inline">
            <BusinessTitle />
          </div>
          <Navbar />
        </nav>
        <div className="grow overflow-y-scroll p-2">
          <div className="rounded-xl bg-white p-4 pt-0">
            {children}
            {modals}
          </div>
        </div>
      </section>
    </DbProvider>
  );
}
