import { redirect } from "next/navigation";
import ContactDetail from "./ContactDetail";

export default async function Page({
  params,
}: {
  params: { contactId: string };
}) {
  if (!params.contactId) redirect("/dashboard");

  return (
    <div className="m-6">
      <ContactDetail id={params.contactId} />
    </div>
  );
}
