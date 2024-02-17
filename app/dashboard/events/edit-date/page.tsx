import { redirect } from "next/navigation";
import NewTicketsForm from "../new-tickets/form";
import EditDateForm from "./form";

export default async function Page({
  searchParams,
}: {
  searchParams: { eventId: string };
}) {
  if (!searchParams.eventId) redirect("/dashboard/events");

  return (
    <div>
      <h1 className="p-2 pt-4 text-2xl font-bold tracking-wider">
        Zvolťe nový termín pre udalosť
      </h1>
      <div className="grid place-content-center">
        <EditDateForm {...searchParams} />
      </div>
    </div>
  );
}
