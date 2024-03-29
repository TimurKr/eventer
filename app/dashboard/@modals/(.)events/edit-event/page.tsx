"use client";

import EditEventForm, {
  type EditEventFormProps,
} from "@/app/dashboard/events/edit-event/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function NewServiceModal({
  searchParams,
}: {
  searchParams: EditEventFormProps;
}) {
  const router = useRouter();

  return (
    <>
      <Dialog open={true} onOpenChange={() => router.back()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {searchParams.eventId ? "Upravte udalosť" : "Zvolťe nový termín"}
            </DialogTitle>
          </DialogHeader>
          <EditEventForm {...searchParams} />
        </DialogContent>
      </Dialog>
    </>
  );
}
