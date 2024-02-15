import { getServerUser } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ContextProvider } from "./store";
import Navbar from "./Navbar";
import { fetchServices } from "./services/serverActions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser(cookies());
  if (!user) {
    return redirect("/login");
  }

  const { data: services, error } = await fetchServices();
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <ContextProvider
      initStoreState={{
        services: {
          services: services,
          allServices: services,
        },
      }}
    >
      <section className="flex h-screen w-full flex-col justify-start bg-slate-200">
        <nav className="auto top-0 z-30 flex flex-none flex-row items-center gap-1 bg-inherit p-2 shadow-md">
          <p className="hidden px-4 text-lg font-bold tracking-wider md:inline">
            {user.name || "No name"}
            {/* TODO: Instant textfield, maybe move this to server */}
            {/* <InstantTextField 
          defaultValue={business?.name || ""}
          placeholder="Názov podniku"
          setLocalValue={(v) => {}}
          updateDatabase={(v) => {}}
          type="text"
          inline
        /> */}
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
