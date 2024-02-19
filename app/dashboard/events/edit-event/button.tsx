import { PlusCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { type EditEventFormProps } from "./form";
import { PencilIcon } from "@heroicons/react/24/solid";

export default function EditEventButton(params: EditEventFormProps) {
  return (
    <Link
      href={{
        pathname: "/dashboard/events/edit-event",
        query: params,
      }}
      className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-sm ${
        params.eventId
          ? "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
          : "border-green-500 bg-green-500 text-white hover:bg-green-600"
      }
      }`}
    >
      {}
      {params.eventId ? (
        <>
          <PencilIcon className="h-4" />
          Upraviť
        </>
      ) : (
        <>
          <PlusCircleIcon className="h-4" />
          Vytvoriť novú udalosť
        </>
      )}
    </Link>
  );
}