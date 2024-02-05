import Link from "next/link";
import { headers, cookies } from "next/headers";
import { createServerSupabase, getServerUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "./SignUpForm";

export default async function Signup({
  searchParams,
}: {
  searchParams: { redirectUrl: string; signupPassword?: string };
}) {
  if (await getServerUser(cookies())) {
    redirect("/dashboard");
  }

  if (searchParams.signupPassword != "cd4c983150824") {
    redirect("/login");
  }

  const signUp = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const password_again = formData.get("password_again") as string;
    if (password !== password_again) {
      return "Heslá sa nezhodujú!";
    }
    const supabase = createServerSupabase(cookies());
    const origin = headers().get("origin");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return error.message;
    }

    redirect(searchParams.redirectUrl || "/dashboard");
  };

  return (
    <div className="grid h-full w-full place-content-center">
      <LoginForm action={signUp} />
      <Link
        href="/"
        className="group absolute left-8 top-8 flex items-center rounded-md bg-btn-background px-4 py-2 text-sm text-foreground no-underline hover:bg-btn-background-hover"
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
        Back
      </Link>
    </div>
  );
}
