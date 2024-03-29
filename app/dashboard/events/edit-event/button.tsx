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
