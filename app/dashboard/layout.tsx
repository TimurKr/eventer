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
        <Navbar profile={user} />
        <div className="grow overflow-y-scroll p-2">
          <div className="rounded-xl bg-white p-4 pt-0">{children}</div>
        </div>
      </section>
    </ContextProvider>
  );
}
