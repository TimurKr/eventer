import { createServerSupabase, getServerUser } from "@/utils/supabase/server";
import Links from "./links";
import { cookies } from "next/headers";
import AuthButton from "@/app/components/AuthButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftStartOnRectangleIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import { ContextProvider } from "./store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getServerUser(cookies()))) {
    redirect("/login");
  }

  const signOut = async () => {
    "use server";

    const cookieStore = cookies();
    const supabase = createServerSupabase(cookieStore);
    await supabase.auth.signOut();
    return redirect("/login");
  };

  return (
    <ContextProvider>
      <section className="flex h-screen w-full flex-col justify-start bg-slate-200">
        <nav className="auto top-0 z-30 flex flex-none flex-row items-center gap-1 bg-inherit p-2 shadow-md">
          <p className="hidden px-4 text-lg font-bold tracking-wider md:inline">
            Tajomné Variácie
          </p>
          <Links />
          <form action={signOut} className="ms-auto w-auto">
            <button
              className="w-full rounded-lg bg-red-500 p-2 text-sm text-white hover:bg-red-600 md:px-3 md:py-1"
              type="submit"
            >
              <span className="hidden md:block">Odhlásiť</span>
              <span className="block md:hidden">
                <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
              </span>
            </button>
          </form>
        </nav>
        <div className="grow overflow-y-scroll p-2">
          <div className="rounded-xl bg-white p-4 pt-0">{children}</div>
        </div>
      </section>
    </ContextProvider>
  );
}
