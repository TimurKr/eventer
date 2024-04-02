"use client";

import NewCouponForm, {
  type NewCouponFormProps,
} from "@/app/dashboard/coupons/new/form";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function Page({
  searchParams,
}: {
  searchParams: NewCouponFormProps;
}) {
  const router = useRouter();

  return (
    <>
      <Dialog open={true} onOpenChange={() => router.back()}>
        <DialogContent>
          <DialogHeader>Vytvorte nový pokaz</DialogHeader>
          <NewCouponForm {...searchParams} />
        </DialogContent>
      </Dialog>
    </>
  );
}
