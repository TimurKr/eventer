import { createServerSupabase, getServerUser } from "@/utils/supabase/server";
import Links from "./links";
import { cookies } from "next/headers";
import AuthButton from "@/components/AuthButton";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <section className="flex h-full justify-start">
      <nav className="flex w-48 flex-col gap-1 bg-gray-100 p-2">
        <p className="p-2 text-lg font-black tracking-widest">
          Tajomné Variácie
        </p>
        <hr className="pb-4" />
        <Links />
        <hr className="mt-2 flex-auto" />
        <Link
          href="/"
          className="group flex items-center rounded-md bg-btn-background px-4 py-1 text-sm text-foreground no-underline hover:bg-btn-background-hover"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>{" "}
          Domov
        </Link>
        <form action={signOut} className="w-auto justify-self-end">
          <button
            className="w-full rounded-md bg-red-100 px-4 py-1 pl-2 text-sm text-red-500 hover:bg-red-200"
            type="submit"
          >
            Odhlásiť
          </button>
        </form>
      </nav>
      <div className="w-5/6 p-4">{children}</div>
    </section>
  );
}
