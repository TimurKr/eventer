import { getUser } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import PasswordChangeForm from "./form";

export default async function PasswordChangePage() {
  const user = await getUser(cookies());
  return (
    <div className="grid h-full place-content-center">
      <div className="max-w-lg">
        <h1 className="text-lg font-medium">Zmena hesla</h1>
        <h2 className="pb-6 text-sm font-medium text-gray-600">
          Vymyslite si nové heslo pre účet {user?.email || "neznámy"}
        </h2>
        <PasswordChangeForm />
      </div>
    </div>
  );
}
