import { createServerSupabase, getServerUser } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ContextProvider } from "./store";
import Navbar from "./Navbar";
import { fetchServices } from "./services/serverActions";
import { InstantTextField } from "@/utils/forms/FormElements";
import { revalidateTag } from "next/cache";
import { fetchContacts } from "./events/serverActions";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser(cookies());
  if (!user) {
    return redirect("/login");
  }

  const servicesQuery = fetchServices();
  const contactsQuery = fetchContacts();

  const [services, contacts] = await Promise.all([
    servicesQuery,
    contactsQuery,
  ]);

  if (services.error) {
    throw new Error(services.error.message);
  }
  if (contacts.error) {
    throw new Error(contacts.error.message);
  }

  return (
    <ContextProvider
      initStoreState={{
        services: {
          services: services.data,
          allServices: services.data,
        },
        events: {
          isRefreshing: true,
          contacts: contacts.data,
        },
        coupons: {
          isRefreshing: true,
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
          <div className="rounded-xl bg-white p-4 pt-0">{children}</div>
        </div>
      </section>
    </ContextProvider>
  );
}
