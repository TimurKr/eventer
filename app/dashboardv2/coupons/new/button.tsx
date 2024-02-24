import { PlusCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewCouponButton() {
  return (
    <Link
      href="/dashboardv2/coupons/new"
      className="flex items-center gap-2 rounded-md bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
    >
      <PlusCircleIcon className="h-5 w-5" />
      Nový poukaz
    </Link>
  );
}
