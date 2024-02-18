import { createServerSupabase, getServerUser } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ContextProvider } from "./store";
import Navbar from "./Navbar";
import { fetchServices } from "./services/serverActions";
import { InstantTextField } from "@/utils/forms/FormElements";
import { revalidateTag } from "next/cache";
import { fetchContacts, fetchEvents } from "./events/serverActions";
import React from "react";
import { mergeNewEvents } from "./events/store/helpers";

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

  const [services, contacts, events] = await Promise.all([
    servicesQuery,
    contactsQuery,
    eventsQuery,
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
      }}
    >
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
    </ContextProvider>
  );
}
