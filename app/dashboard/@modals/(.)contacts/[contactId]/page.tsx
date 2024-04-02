"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import ContactDetail from "../../../contacts/[contactId]/ContactDetail";

export default function NewContact({
  params,
}: {
  params: { contactId: string };
}) {
  const router = useRouter();

  if (!params.contactId) router.push("/dashboard/contacts");

  return (
    <>
      <Dialog open={true} onOpenChange={() => router.back()}>
        <DialogContent size={"4xl"}>
          <ContactDetail id={params.contactId} />
        </DialogContent>
      </Dialog>
    </>
  );
}
