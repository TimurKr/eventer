import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { NewContactFormProps } from "./form";

export default function NewContactButton({
  initialValues,
  className,
}: {
  initialValues?: NewContactFormProps["initValues"];
  className?: string;
}) {
  return (
    <Button asChild variant={"default"} size={"sm"} className={className}>
      <Link
        href={{
          pathname: "/dashboard/contacts/new-contact",
          query: initialValues,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <UserPlusIcon className="mr-2 h-4 w-4" />
        Vytvoriť kontakt
      </Link>
    </Button>
  );
}
