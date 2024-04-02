"use client";

import { FormDateField } from "@/components/forms/FormDateField";
import { FormSelectField } from "@/components/forms/FormSelectField";
import { FormSwitchField } from "@/components/forms/FormSwitchField";
import { FormTextField } from "@/components/forms/FormTextField";
import SubmitButton from "@/components/forms/SubmitButton";
import { Form } from "@/components/ui/form";
import { useRxData } from "@/rxdb/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMonths, addWeeks } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as z from "zod";
import NewServiceButton from "../../services/edit/button";

const formSchema = z.object({
  date: z.date({ required_error: "Vyplňte dátum" }),
  time: z.string({ required_error: "Vyplňte čas" }),
  isPublic: z.boolean().default(false),
  service_id: z
    .string({ required_error: "Vyberte službu" })
    .min(1, "Vyberte službu"),
});

type FormValues = z.infer<typeof formSchema>;

export type EditEventFormProps = {
  eventId?: string;
};

export default function EditEventForm(
  props?: EditEventFormProps & { onSubmit?: () => void },
) {
  const router = useRouter();

  const { result: allServices, isFetching: isFetchingAllServices } = useRxData(
    "services",
    useCallback((collection) => collection.find().sort("name"), []),
    { initialResult: [] },
  );

  const { result: event, collection: eventsCollection } = useRxData(
    "events",
    (collection) => collection.findOne(props?.eventId || "not an id"),
  );

  const form = useForm<FormValues>({
    defaultValues: {
      date: new Date(),
      time: "12:00",
      isPublic: false,
      service_id: allServices[0]?.id || "",
    },
    resolver: zodResolver(formSchema),
  });

  const reset = form.reset;
  useEffect(() => {
    event
      ? reset({
          date: new Date(event.datetime),
          time: new Date(event.datetime).toLocaleTimeString().slice(0, 5),
          isPublic: !!event.is_public,
          service_id: event.service_id,
        })
      : reset();
  }, [event, reset]);

  const create = async (values: FormValues) => {
    if (!eventsCollection) return;
    await eventsCollection.insert({
      id: crypto.randomUUID(),
      datetime: new Date(
        values.date.toDateString() + " " + values.time,
      ).toISOString(),
      is_public: values.isPublic,
      service_id: values.service_id,
    });
    toast.success("Udalosť vytvorená!", { autoClose: 1500 });
    props?.onSubmit ? props.onSubmit() : router.back();
  };

  const update = async (values: FormValues) => {
    if (!event) return;
    await event.incrementalPatch({
      datetime: new Date(
        values.date.toDateString() + " " + values.time,
      ).toISOString(),
      is_public: values.isPublic,
      service_id: values.service_id,
    });
    toast.success("Udalosť upravená!", { autoClose: 1500 });
    props?.onSubmit ? props.onSubmit() : router.back();
  };

  if (!allServices && !isFetchingAllServices) {
    return (
      <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
        Žiadne predstavenia
        <NewServiceButton />
      </div>
    );
  }

  return (
    <Form
      form={form}
      onSubmit={props?.eventId ? update : create}
      className="flex flex-col gap-4"
    >
      {!event && (
        <FormSelectField
          form={form}
          name="service_id"
          label="Predstavenie"
          horizontal
          placeholder="Vyberte si predstavenie"
          options={allServices.reduce<Record<string, React.ReactNode>>(
            (acc, obj) => {
              acc[obj.id] = obj.name;
              return acc;
            },
            {},
          )}
        />
      )}
      <FormDateField
        form={form}
        name="date"
        label="Dátum"
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
        name="time"
        type="time"
        label="Čas"
        step={60}
        horizontal
      />
      <FormSwitchField form={form} name="isPublic" label="Verejné" horizontal />
      <SubmitButton
        form={form}
        label={event?.id ? "Uložiť" : "Vytvoriť"}
        submittingLabel={event?.id ? "Ukladám" : "Vytváram..."}
      />
    </Form>
  );
}
