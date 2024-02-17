import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewTicketsButton(params: {
  eventId: string;
  couponCode?: string;
}) {
  return (
    <Link
      href={{
        pathname: "/dashboard/events/new-tickets",
        query: params,
      }}
      className="rounded-md bg-green-500 px-2 py-0.5 text-xs text-white hover:bg-green-600"
    >
      Vytvoriť lístok
    </Link>
  );
}