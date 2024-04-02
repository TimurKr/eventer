import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { NewCouponFormProps } from "./form";

export default function NewCouponButton(props: NewCouponFormProps) {
  return (
    <Button asChild variant={"default"} size={"sm"}>
      <Link
        href={{
          pathname: "/dashboard/coupons/new",
          query: props,
        }}
      >
        <PlusCircleIcon className="me-2 h-5 w-5" />
        Nový poukaz
      </Link>
    </Button>
  );
}
