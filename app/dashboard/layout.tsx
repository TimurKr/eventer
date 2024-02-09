import { createServerSupabase, getServerUser } from "@/utils/supabase/server";
import Links from "./Navbar";
import { cookies } from "next/headers";
import AuthButton from "@/app/components/AuthButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftStartOnRectangleIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import { ContextProvider } from "./store";
import Navbar from "./Navbar";
import { fetchServices } from "./serverActions";
import { useEffect } from "react";

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
