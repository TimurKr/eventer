import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { FormField, FormMessage } from "../ui/form";

export default function FormError<Values extends FieldValues>({
  form,
  name,
}: {
  form: UseFormReturn<Values>;
  name: Path<Values>;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={() => <FormMessage />}
    />
  );
}
