"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import ServiceForm from "../../../services/edit/form";

export default function NewServiceModal({
  searchParams,
}: {
  searchParams: { serviceId?: string };
}) {
  const router = useRouter();

  return (
    <>
      <Dialog open={true} onOpenChange={() => router.back()}>
        <DialogContent>
          <DialogTitle>
            {searchParams.serviceId
              ? "Upraviť predstavenie"
              : "Vytvorte si nové predstavenie"}
          </DialogTitle>
          <ServiceForm serviceId={searchParams.serviceId} />
        </DialogContent>
      </Dialog>
    </>
  );
}
