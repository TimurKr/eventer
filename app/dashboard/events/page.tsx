import { createServerSupabase } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import EventsAccordion from "./EventsAccordion";
import { PlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { Button } from "flowbite-react";
import NewEventModal from "./NewEventModal";
import { fetchEvents } from "./serverActions";

export default async function Page() {
  const { data: events, error } = await fetchEvents();
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
