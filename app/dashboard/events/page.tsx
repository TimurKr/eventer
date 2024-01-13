import { createServerSupabase } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import EventsAccordion from "./EventsAccordion";
import { PlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { Button } from "flowbite-react";

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
        <p className="text-2xl font-bold tracking-wider">
          Termíny Tajomných Variácií
        </p>
        {/* // @ts-ignore */}
        <Link
          color="success"
          href={"events/new_event"}
          className="m-2 flex items-center gap-2 rounded-lg bg-cyan-700 px-2 py-1 text-sm text-white hover:bg-cyan-800"
        >
          <PlusIcon className="h-5 w-5" />
          Nový termín
        </Link>
      </div>
      <EventsAccordion events={events} />
    </div>
  );
}
