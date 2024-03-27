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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type FormSelectFieldProps<Values extends FieldValues> = {
  form: UseFormReturn<Values>;
  name: Path<Values>;
  label?: string;
  description?: string;
  horizontal?: boolean;
  options: Record<string, React.ReactNode>;
  placeholder?: string;
};

export function FormSelectField<Values extends FieldValues>({
  form,
  name,
  label,
  horizontal,
  description,
  options,
  placeholder,
}: FormSelectFieldProps<Values>) {
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
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger
                className={cn(
                  horizontal ? (label ? "col-span-3" : "col-span-4") : "",
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(options).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
