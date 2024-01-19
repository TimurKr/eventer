import { createServerSupabase } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import EventsAccordion from "./EventsAccordion";
import { PlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { Button } from "flowbite-react";
import NewEventModal from "./NewEventModal";

export default async function Page() {
  const supabase = createServerSupabase(cookies(), ["events", "tickets"]);
  const { data: events, error } = await supabase
    .from("events")
    .select(
      `*,
      tickets (*)`,
    )
    .order("datetime", { ascending: false })
    .order("billing_name", { referencedTable: "tickets", ascending: true })
    .order("type", { referencedTable: "tickets", ascending: true });
  if (error) {
    console.error(error);
    return <div>Error loading events</div>;
  }

  return (
    <div className="flex flex-col">
      <EventsAccordion events={events} />
    </div>
  );
}
