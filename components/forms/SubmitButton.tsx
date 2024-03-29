"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function SubmitButton({
  isSubmitting,
  label = "Hotovo",
  submittingLabel = "Pracujem...",
  type = "submit",
  ...props
}: {
  isSubmitting: boolean;
  label?: string;
  submittingLabel?: string;
} & ButtonProps) {
  return (
    <Button
      variant={"default"}
      disabled={isSubmitting}
      {...props}
      className={cn("mt-4", props.className)}
    >
      {isSubmitting ? (
        <>
          <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          {submittingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
