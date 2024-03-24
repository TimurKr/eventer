import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewCouponButton() {
  return (
    <Button asChild variant={"default"} size={"sm"}>
      <Link href="/dashboard/coupons/new">
        <PlusCircleIcon className="h-5 w-5" />
        Nový poukaz
      </Link>
    </Button>
  );
}
