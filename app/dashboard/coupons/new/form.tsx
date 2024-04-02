"use client";

import { FormDateField } from "@/components/forms/FormDateField";
import { FormTextField } from "@/components/forms/FormTextField";
import SelectContactField from "@/components/forms/SelectContactField";
import SubmitButton from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useRxCollection, useRxData } from "@/rxdb/db";
import { ArrowPathIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMonths, addWeeks } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";

const validationSchema = z.object({
  code: z
    .string({ required_error: "Kód je povinný" })
    .length(8, "Kód musí mať 8 znakov"),
  amount: z
    .number({ required_error: "Suma je povinná" })
    .min(0, "Suma musí byť kladná"),
  note: z.string(),
  valid_until: z.date().nullable(),
  contact: z
    .string()
    .uuid()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

type Values = z.infer<typeof validationSchema>;

export default function NewCouponForm(props: { onSubmit?: () => void }) {
  const router = useRouter();

  const { result: contacts, collection: contactsCollection } = useRxData(
    "contacts",
    useCallback((collection) => collection.find(), []),
    { initialResult: [] },
  );

  const couponsCollection = useRxCollection("coupons");

  const form = useForm<Values>({
    defaultValues: {
      code: uuidv4().slice(0, 8).toUpperCase(),
      amount: 100,
      note: "",
      valid_until: null,
      contact: "",
    },
    resolver: zodResolver(validationSchema),
  });

  const onSubmit = async (values: Values) => {
    if (!contactsCollection || !couponsCollection) return;
    if (
      !values.contact &&
      !confirm(
        "Naozaj chcete vytvoriť poukaz bez mena? Poukaz nebude priradený k žiadnemu kontaktu.",
      )
    )
      return;

    await couponsCollection.insert({
      id: crypto.randomUUID(),
      code: values.code,
      amount: values.amount,
      note: values.note,
      original_amount: values.amount,
      contact_id: values.contact,
      valid_until: values.valid_until?.toISOString(),
    });

    toast.success("Poukaz bol vytvorený", { autoClose: 1500 });
    props.onSubmit ? props.onSubmit() : router.back();
  };

  return (
    <>
      <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-2">
        <div className="grid grid-cols-4 items-center gap-x-4">
          <Label className="text-end">Kontakt</Label>
          <SelectContactField
            form={form}
            name="contact"
            buttonProps={{ className: "col-span-3 justify-self-start" }}
            description="Vyberte kontakt ku poukazu"
          />
        </div>
        <FormTextField
          form={form}
          name="amount"
          label="Suma"
          type="number"
          horizontal
          icons={{ start: <CurrencyEuroIcon className="h-4 w-4" /> }}
        />
        <FormTextField form={form} name="note" label="Poznámka" horizontal />
        <FormDateField
          form={form}
          name="valid_until"
          label="Platný do"
          horizontal
          presets={[
            { label: "Dnes", value: new Date() },
            { label: "Zajtra", value: addDays(new Date(), 1) },
            { label: "O týždeň", value: addWeeks(new Date(), 1) },
            { label: "O mesiac", value: addMonths(new Date(), 1) },
            { label: "O tri mesiace", value: addMonths(new Date(), 3) },
            { label: "O pol roka", value: addMonths(new Date(), 6) },
            { label: "O rok", value: addMonths(new Date(), 12) },
          ]}
        />
        <FormTextField
          form={form}
          name="code"
          label="Kód"
          horizontal
          icons={{
            end: (
              <Button variant="ghost" type="button" tabIndex={-1} size="icon">
                <ArrowPathIcon
                  className="h-4 w-4"
                  onClick={() =>
                    form.setValue("code", uuidv4().slice(0, 8).toUpperCase())
                  }
                />
              </Button>
            ),
          }}
        />
        <SubmitButton
          className="ms-auto"
          form={form}
          allowSubmitDefault
          label="Vytvoriť"
          submittingLabel="Vytváram..."
        />
      </Form>
    </>
  );
}
