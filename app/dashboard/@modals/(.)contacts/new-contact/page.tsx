"use client";

import NewContactForm from "@/app/dashboard/contacts/new-contact/form";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function NewContact() {
  const router = useRouter();

  return (
    <>
      <Dialog open={true} onOpenChange={() => router.back()}>
        <DialogHeader>Vytvorte nové lístky</DialogHeader>
        <DialogContent>
          <NewContactForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
