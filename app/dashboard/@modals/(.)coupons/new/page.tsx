"use client";

import NewCouponForm from "@/app/dashboard/coupons/new/form";
import { type EditEventFormProps } from "@/app/dashboard/events/edit-event/form";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function Page({
  searchParams,
}: {
  searchParams: EditEventFormProps;
}) {
  const router = useRouter();

  return (
    <>
      <Dialog open={true} onOpenChange={() => router.back()}>
        <DialogHeader>Vytvorte nový pokaz</DialogHeader>
        <DialogContent>
          <NewCouponForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
