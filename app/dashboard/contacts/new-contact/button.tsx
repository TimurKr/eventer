import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewContactButton({
  params,
  className,
}: {
  params?: {};
  className?: string;
}) {
  return (
    <Button asChild variant={"default"} size={"sm"} className={className}>
      <Link
        href={{
          pathname: "/dashboard/contacts/new-contact",
          query: params,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <UserPlusIcon className="mr-2 h-4 w-4" />
        Vytvoriť kontakt
      </Link>
    </Button>
  );
}
