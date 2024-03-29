import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewServiceButton() {
  return (
    <Button asChild variant={"default"} size={"sm"}>
      <Link href="/dashboard/services/edit">
        <PlusCircleIcon className="me-2 h-5 w-5" />
        Nové predstavenie
      </Link>
    </Button>
  );
}
