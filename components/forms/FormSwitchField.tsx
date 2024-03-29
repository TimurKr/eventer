import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";
import { SwitchProps } from "@radix-ui/react-switch";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Switch } from "../ui/switch";

export type FormSwitchFieldProps<Values extends FieldValues> = Omit<
  SwitchProps,
  "form"
> & {
  form: UseFormReturn<Values>;
  name: Path<Values>;
  label?: string;
  description?: string;
  horizontal?: boolean;
};

export function FormSwitchField<Values extends FieldValues>({
  form,
  name,
  label,
  horizontal,
  description,
  ...props
}: FormSwitchFieldProps<Values>) {
  return (
    <FormField
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <FormItem
          className={cn(
            horizontal ? "grid grid-cols-4 items-center gap-x-4 space-y-0" : "",
          )}
        >
          {label && (
            <FormLabel className={cn(horizontal ? "text-end" : "")}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Switch {...field} {...props} />
          </FormControl>
          {description && (
            <FormDescription
              className={cn(
                horizontal && "col-span-3 col-start-2 pt-1",
                "px-1",
              )}
            >
              {description}
            </FormDescription>
          )}
          <FormMessage
            className={cn(
              horizontal ? "col-span-3 col-start-2 pt-1" : "",
              "px-1",
            )}
          />
        </FormItem>
      )}
    />
  );
}
