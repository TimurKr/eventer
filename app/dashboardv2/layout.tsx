"use client";

import { initialize } from "@/rxdb/db";
import React, { useEffect, useState } from "react";
import { RxDatabase } from "rxdb";
import { Provider } from "rxdb-hooks";
import Navbar from "./Navbar";

export default function DashboardLayout({
  children,
  modals,
}: {
  children: React.ReactNode;
  modals: React.ReactNode;
}) {
  const [db, setDb] = useState<RxDatabase<any> | null>(null);

  useEffect(() => {
    // RxDB instantiation can be asynchronous
    initialize().then((r) => setDb(r.db));
  }, []);

  return (
    // <ContextProvider>
    <Provider db={db}>
      <section className="flex h-screen w-full flex-col justify-start bg-slate-200">
        <nav className="auto top-0 z-30 flex flex-none flex-row items-center gap-1 bg-inherit p-2 shadow-md">
          <p className="hidden px-4 text-lg font-bold tracking-wider md:inline">
            {/* <InstantTextField
                defaultValue={user?.name || ""}
                placeholder="Názov podniku"
                updateDatabase={async (v) => {
                  "use server";
                  const r = await createServerSupabase(cookies())
                    .from("businesses")
                    .update({ name: v })
                    .eq("id", user.id);
                  if (r.error) console.error(r.error);
                  else revalidateTag("user");
                  return r;
                }}
                type="text"
                inline
                showAlways={false}
                trim
              /> */}
          </p>
          <Navbar />
        </nav>
        <div className="grow overflow-y-scroll p-2">
          <div className="rounded-xl bg-white p-4 pt-0">
            {children}
            {modals}
          </div>
        </div>
      </section>
    </Provider>
    // </ContextProvider>
  );
}
