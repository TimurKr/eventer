import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input, InputProps } from "../ui/input";

export type FormTextFieldProps<Values extends FieldValues> = Omit<
  InputProps,
  "form"
> & {
  form: UseFormReturn<Values>;
  name: Path<Values>;
  label?: string;
  description?: string;
  horizontal?: boolean;
};

export function FormTextField<Values extends FieldValues>({
  form,
  name,
  label,
  horizontal,
  description,
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
            props.baseClassName,
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
              onChange={(e) =>
                props.type === "number"
                  ? field.onChange(parseInt(e.target.value))
                  : field.onChange(e)
              }
              {...props}
              baseClassName={cn(
                horizontal ? (label ? "col-span-3" : "col-span-4") : "",
              )}
            />
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
