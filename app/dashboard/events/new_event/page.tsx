import { createBrowserSupabase } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import NewEventForm from "./NewEventForm";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

export default function Page() {
  return (
    <div className="grid h-screen place-items-center">
      <div>
        <p className="text-2xl">Nový termín</p>
        <NewEventForm />
      </div>
    </div>
  );
}
