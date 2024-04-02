"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { type FieldValues, type UseFormReturn } from "react-hook-form";

export default function SubmitButton<Values extends FieldValues = FieldValues>(
  args: {
    /**
     * If form is provided, and
     *  - submitting is not provided, it will be set to form.formState.isSubmitting
     *  - disabled is not provided, the button will be disabled if submitting or the
     * form is not dirty (when only default values are present)
     */
    form?: UseFormReturn<Values>;
    submitting?: boolean;
    label?: string;
    submittingLabel?: string;
    /**
     * The default behavior disables the button unless the form isDirty.
     * This will override it and allow submitting with the default values.
     */
    allowSubmitDefault?: boolean;
  } & Omit<ButtonProps, "form">,
) {
  let {
    form,
    submitting,
    disabled,
    allowSubmitDefault,
    label = "Hotovo",
    submittingLabel = "Pracujem...",
    type = "submit",
    ...props
  } = args;

  if (submitting === undefined && form) {
    submitting = form.formState.isSubmitting;
  }

  if (disabled === undefined && form) {
    disabled = submitting || (!allowSubmitDefault && !form.formState.isDirty);
  }

  // Force rerender on all changes
  const watchedFields = form?.watch();
  return (
    <Button
      variant={"default"}
      disabled={disabled}
      {...props}
      className={cn("mt-4", props.className)}
    >
      {submitting ? (
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
