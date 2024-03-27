import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { PencilIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { type EditEventFormProps } from "./form";

export default function EditEventButton(params: EditEventFormProps) {
  return (
    <Button asChild variant={params.eventId ? "outline" : "default"} size="sm">
      <Link
        href={{
          pathname: "/dashboard/events/edit-event",
          query: params,
        }}
        // className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
        //   params.eventId
        //     ? "border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100"
        //     : "bg-green-500 text-white hover:bg-green-600"
        // }
        // }`}
      >
        {}
        {params.eventId ? (
          <>
            <PencilIcon className="me-2 h-4" />
            Upraviť
          </>
        ) : (
          <>
            <PlusCircleIcon className="me-2 h-4" />
            Vytvoriť novú udalosť
          </>
        )}
      </Link>
    </Button>
  );
}
