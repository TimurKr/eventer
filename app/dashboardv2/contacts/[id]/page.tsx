import { redirect } from "next/navigation";
import ContactDetail from "./body";

export default async function Page({ params }: { params: { id: string } }) {
  if (!params.id) redirect("/dashboardv2");

  return (
    <div>
      <h1 className="p-2 pt-4 text-2xl font-bold tracking-wider">
        Contact detail
      </h1>
      <div className="grid place-content-center">
        <ContactDetail id={params.id} />
      </div>
    </div>
  );
}
