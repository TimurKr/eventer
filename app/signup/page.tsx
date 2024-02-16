import Link from "next/link";
import { headers, cookies } from "next/headers";
import { createServerSupabase, getServerUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "./SignUpForm";

export default async function Signup({
  searchParams,
}: {
  searchParams: { redirectUrl: string };
}) {
  if (await getServerUser(cookies())) {
    redirect("/dashboard");
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
    <div className="grid h-full w-full animate-in place-content-center">
      <LoginForm action={signUp} />
      <Link
        href="/login"
        className="mt-2 rounded-lg p-2 text-center text-sm tracking-wide text-gray-500 transition-all hover:text-gray-700 hover:underline"
      >
        Máte účet? Prihlásiť sa
      </Link>
    </div>
  );
}
