import { redirect } from "next/navigation";
import NewTicketsForm from "./form";

export default async function Page({
  searchParams,
}: {
  searchParams: { eventId: string; couponCode?: string };
}) {
  if (!searchParams.eventId) redirect("/dashboard/events");

  return (
    <div>
      <h1 className="p-2 pt-4 text-2xl font-bold tracking-wider">
        Vytvorte nové lístky
      </h1>
      <div className="grid place-content-center">
        <NewTicketsForm {...searchParams} />
      </div>
    </div>
  );
}
