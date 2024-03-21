"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function SubmitButton({
  isSubmitting,
  label = "Hotovo",
  submittingLabel = "Pracujem...",
  className = "",
}: {
  isSubmitting: boolean;
  label?: string;
  submittingLabel?: string;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      variant={"default"}
      disabled={isSubmitting}
      className={cn("mt-4", className)}
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
