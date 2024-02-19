import { redirect } from "next/navigation";
import EditEventForm, { type EditEventFormProps } from "./form";

export default async function Page({
  searchParams,
}: {
  searchParams: EditEventFormProps;
}) {
  return (
    <div>
      <h1 className="p-2 pt-4 text-2xl font-bold tracking-wider">
        {searchParams.eventId ? "Upravte udalosť" : "Nová udalosť"}
      </h1>
      <div className="grid place-content-center">
        <EditEventForm {...searchParams} />
      </div>
    </div>
  );
}
