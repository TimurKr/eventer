"use client";

import NewContactForm, {
  NewContactFormProps,
} from "@/app/dashboard/contacts/new/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function NewContact({
  searchParams,
}: {
  searchParams: NewContactFormProps["initValues"];
}) {
  const router = useRouter();

  return (
    <>
      <Dialog open={true} onOpenChange={() => router.back()}>
        <DialogTrigger />
        <DialogContent>
          <DialogHeader>Vytvorte nový kontakt</DialogHeader>
          <NewContactForm initValues={searchParams} />
        </DialogContent>
      </Dialog>
    </>
  );
}
