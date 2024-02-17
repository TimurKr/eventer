import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function EditDateButton(params: {
  eventId: string;
  couponCode?: string;
}) {
  return (
    <Link
      href={{
        pathname: "/dashboard/events/edit-date",
        query: params,
      }}
      className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-sm text-gray-500 hover:bg-gray-200"
    >
      Zmeniť termín
    </Link>
  );
}
