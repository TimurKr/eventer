import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";
import DatePicker, { DatePickerProps } from "../inputs/DatePicker";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

export type FormTextFieldProps<Values extends FieldValues> = Omit<
  DatePickerProps,
  "onChange" | "value"
> & {
  form: UseFormReturn<Values>;
  name: Path<Values>;
  label?: string;
  horizontal?: boolean;
  description?: string;
};

export function FormDateField<Values extends FieldValues>({
  form,
  name,
  label,
  horizontal,
  description,
  ...props
}: FormTextFieldProps<Values>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
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
          <DatePicker
            value={field.value}
            onChange={field.onChange}
            buttonProps={{
              className: cn(
                horizontal && "w-full",
                horizontal ? (label ? "col-span-3" : "col-span-4") : "flex",
              ),
            }}
            {...props}
          />
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
