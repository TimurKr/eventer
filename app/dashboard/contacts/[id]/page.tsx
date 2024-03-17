import { redirect } from "next/navigation";
import ContactDetail from "./ContactDetail";

export default async function Page({ params }: { params: { id: string } }) {
  if (!params.id) redirect("/dashboard");

  return (
    <div className="m-6">
      <ContactDetail id={params.id} />
    </div>
  );
}
