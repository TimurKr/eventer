import { InstantTextField } from "@/utils/forms/FormElements";
import { createServerSupabase, getServerUser } from "@/utils/supabase/server";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import Navbar from "./Navbar";
import { fetchCoupons } from "./coupons/serverActions";
import { fetchContacts, fetchEvents } from "./events/serverActions";
import { mergeNewEvents } from "./events/store/helpers";
import LocalDbProvider from "./localDB";
import { fetchServices } from "./services/serverActions";
import { ContextProvider } from "./store_dep";

export default async function DashboardLayout({
  children,
  modals,
}: {
  children: React.ReactNode;
  modals: React.ReactNode;
}) {
  const user = await getServerUser(cookies());
  if (!user) {
    return redirect("/login");
  }

  const servicesQuery = fetchServices();
  const contactsQuery = fetchContacts();
  const eventsQuery = fetchEvents();
  const couponsQuery = fetchCoupons();

  const [services, contacts, events, coupons] = await Promise.all([
    servicesQuery,
    contactsQuery,
    eventsQuery,
    couponsQuery,
  ]);

  if (services.error) {
    throw new Error(services.error.message);
  }
  if (contacts.error) {
    throw new Error(contacts.error.message);
  }
  if (events.error) {
    throw new Error(events.error.message);
  }
  if (coupons.error) {
    throw new Error(coupons.error.message);
  }

  return (
    <ContextProvider
      initStoreState={{
        services: {
          services: services.data,
          allServices: services.data,
        },
        events: {
          contacts: contacts.data,
          ...mergeNewEvents({
            newEvents: events.data,
            searchTerm: "",
            contacts: contacts.data,
          }),
        },
        coupons: {
          coupons: coupons.data,
          allCoupons: coupons.data,
        },
      }}
    >
      <LocalDbProvider>
        <section className="flex h-screen w-full flex-col justify-start bg-slate-200">
          <nav className="auto top-0 z-30 flex flex-none flex-row items-center gap-1 bg-inherit p-2 shadow-md">
            <p className="hidden px-4 text-lg font-bold tracking-wider md:inline">
              <InstantTextField
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
              />
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
      </LocalDbProvider>
    </ContextProvider>
  );
}
