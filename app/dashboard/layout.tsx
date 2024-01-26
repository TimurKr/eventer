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
    <section className="flex h-full w-full justify-start overflow-clip bg-slate-200">
      <nav className="auto flex flex-none flex-col gap-1 p-2 pe-0">
        <p className="hidden p-2 text-lg font-bold tracking-wider md:inline">
          Tajomné Variácie
        </p>
        <hr className="pb-4" />
        <Links />
        <hr className="mt-2 flex-auto" />
        {/* <Link
          href="/"
          className="group flex items-center justify-center rounded-md px-4 py-1 text-sm"
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Domov
        </Link> */}
        <form action={signOut} className="w-auto justify-self-end">
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
      <div className="m-2 grow overflow-y-auto rounded-xl bg-white p-4 pe-2">
        {children}
      </div>
    </section>
  );
}
