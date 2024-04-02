import { cn } from "@/lib/utils";
import { useRxData } from "@/rxdb/db";
import { ArrowPathIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import {
  useWatch,
  type FieldPathByValue,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import {
  SelectContactDialog,
  SelectContactDialogProps,
} from "../inputs/SelectContactDialog";
import { Button, ButtonProps } from "../ui/button";
import { FormField, FormMessage } from "../ui/form";

export default function SelectContactField<V extends FieldValues>({
  form,
  name,
  buttonProps,
  required,
  ...props
}: {
  form: UseFormReturn<V>;
  name: FieldPathByValue<V, string> | FieldPathByValue<V, string | undefined>;
  buttonProps?: ButtonProps;
  required?: boolean;
} & Partial<SelectContactDialogProps>) {
  const _contact = useWatch({ control: form.control, name });

  const { result: contact } = useRxData(
    "contacts",
    (c) => c.findOne(_contact),
    { initialResult: null },
  );

  return (
    <>
      <SelectContactDialog
        // @ts-expect-error name definitelly expects a string
        onSelected={(c) => form.setValue(name, c.id)}
        {...props}
      >
        <Button
          variant={"link"}
          {...buttonProps}
          className={cn(
            required && !_contact && "text-red-600",
            buttonProps?.className,
          )}
        >
          {contact ? (
            <>
              <ArrowPathIcon className="me-2 h-4 w-4" />
              {contact.name || "Kontakt bez mena"}
            </>
          ) : (
            <>
              <UserPlusIcon className="me-2 h-4 w-4" />
              Zvoliť kontakt
            </>
          )}
        </Button>
      </SelectContactDialog>
      <FormField
        control={form.control}
        name={name}
        render={() => <FormMessage className="ps-2" />}
      />
    </>
  );
}
