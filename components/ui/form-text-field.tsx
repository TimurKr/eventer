import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input, InputProps } from "./input";

export type FormTextFieldProps<Values extends FieldValues> = Omit<
  InputProps,
  "form"
> & {
  form: UseFormReturn<Values>;
  name: Path<Values>;
  label?: string;
  horizontal?: boolean;
  hint?: string;
};

export function FormTextField<Values extends FieldValues>({
  form,
  name,
  label,
  horizontal,
  hint,
  ...props
}: FormTextFieldProps<Values>) {
  return (
    <FormField
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <FormItem
          className={cn(
            horizontal ? "grid grid-cols-4 items-center gap-x-4 space-y-0" : "",
            props.type === "hidden" ? "hidden" : "",
          )}
        >
          {label && (
            <FormLabel className={cn(horizontal ? "text-end" : "")}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Input
              {...field}
              error={!!fieldState.error}
              {...props}
              className={cn(
                horizontal ? (label ? "col-span-3" : "col-span-4") : "",
                props.className,
              )}
            />
          </FormControl>
          {hint && (
            <FormDescription
              className={cn(
                horizontal && "col-span-3 col-start-2 pt-1",
                "px-1",
                props.className,
              )}
            >
              {hint}
            </FormDescription>
          )}
          <FormMessage
            className={cn(
              horizontal ? "col-span-3 col-start-2 pt-1" : "",
              "px-1",
              props.className,
            )}
          />
        </FormItem>
      )}
    />
  );
}
