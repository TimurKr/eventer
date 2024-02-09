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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser(cookies());
  if (!user) {
    return redirect("/login");
  }

  const supabase = createServerSupabase(cookies());
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .order("name");

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const signOut = async () => {
    "use server";

    const cookieStore = cookies();
    const supabase = createServerSupabase(cookieStore);
    await supabase.auth.signOut();
    return redirect("/login");
  };

  return (
    <ContextProvider
      initStoreState={{
        services: {
          services: services,
          selectedService: services[0] || null,
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
