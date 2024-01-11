import { createServerSupabase } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import EventsAccordion from "./EventsAccorion";
import { PlusIcon } from "@heroicons/react/24/solid";

export default async function Page() {
  const supabase = createServerSupabase(cookies());
  const { data: events, error } = await supabase
    .from("events")
    .select(
      `*,
      tickets (*)`,
    )
    .order("datetime", { ascending: false });
  if (error) {
    console.error(error);
    return <div>Error loading events</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-xl">Termíny Tejomných Variácií</p>
        <button className="border-1 m-2 flex items-center self-end rounded-md border border-green-300 bg-green-200 px-2 py-1 text-sm text-green-700 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400">
          <PlusIcon className="h-6 w-6" />
          Nový termín
        </button>
      </div>
      <EventsAccordion events={events} />
    </div>
  );
}
