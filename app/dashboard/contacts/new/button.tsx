import { Button, buttonVariants } from "@/components/ui/button";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { VariantProps } from "class-variance-authority";
import Link from "next/link";
import { NewContactFormProps } from "./form";

export default function NewContactButton({
  initialValues,
  redirectOnSuccess,
  className,
  variant,
  size,
}: {
  initialValues?: NewContactFormProps["initValues"];
  redirectOnSuccess?: NewContactFormProps["redirectOnSuccess"];
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  return (
    <Button
      asChild
      variant={variant || "default"}
      size={size || "sm"}
      className={className}
    >
      <Link
        href={{
          pathname: "/dashboard/contacts/new",
          query: { ...initialValues, redirectOnSuccess },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <UserPlusIcon className="mr-2 h-4 w-4" />
        Vytvoriť kontakt
      </Link>
    </Button>
  );
}
