"use client";

import FormError from "@/components/forms/FormError";
import { FormSwitchField } from "@/components/forms/FormSwitchField";
import { FormTextField } from "@/components/forms/FormTextField";
import SubmitButton from "@/components/forms/SubmitButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRxData } from "@/rxdb/db";
import {
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

const validationSchema = z.object({
  name: z.string({ required_error: "Názov je povinný" }),
  ticket_types: z
    .object({
      id: z.string(),
      label: z
        .string({ required_error: "Názov je povinný" })
        .min(3, "Zadajte aspoň 3 znaky"),
      capacity: z.number().int("Zadajte celé číslo").optional(),
      price: z.number({ required_error: "Cena je povinná" }),
      is_vip: z.boolean().default(false),
    })
    .array()
    .nonempty("Musíte mať aspoň 1 typ lístka"),
});

type FormValues = z.infer<typeof validationSchema>;

export type ServiceFormProps = {
  serviceId?: string;
  initialTitle?: string;
};

export default function ServiceForm({
  serviceId,
  initialTitle,
  onSubmit,
}: ServiceFormProps & { onSubmit?: () => void }) {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const router = useRouter();

  const { result: service, collection: servicesCollection } = useRxData(
    "services",
    useCallback(
      (collection) => collection.findOne(serviceId || "definitely not an ID"),
      [serviceId],
    ),
  );

  const {
    result: ticket_types,
    collection: ticketTypesCollection,
    isFetching: isFetchingTicketTypes,
  } = useRxData(
    "ticket_types",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            service_id: serviceId,
          },
        }),
      [serviceId],
    ),
  );

  const { result: tickets } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            type_id: {
              $in: ticket_types?.map((t) => t.id) || [],
            },
          },
        }),
      [ticket_types],
    ),
    { hold: isFetchingTicketTypes },
  );

  const form = useForm<FormValues>({
    defaultValues: {
      name: service?.name || initialTitle || "",
      ticket_types: [],
    },
    resolver: zodResolver(validationSchema),
  });

  const ticketTypesArrays = useFieldArray({
    name: "ticket_types",
    control: form.control,
  });

  const reset = form.reset;
  useEffect(() => {
    reset({
      name: service?.name || initialTitle || "",
      ticket_types: (service &&
        ticket_types?.map((tt) => ({
          ...tt._data,
          capacity: tt.capacity || undefined,
        }))) || [
        {
          id: crypto.randomUUID(),
          label: "Standard",
          price: 20,
          capacity: 100,
          is_vip: false,
        },
      ],
    });
  }, [initialTitle, reset, service, ticket_types]);

  const create = async (values: FormValues) => {
    if (!servicesCollection || !ticketTypesCollection) {
      console.error("Collections not found");
      return;
    }

    const { ticket_types, ...serviceValues } = values;
    const newService = await servicesCollection.insert({
      ...serviceValues,
      id: crypto.randomUUID(),
    });
    const { error } = await ticketTypesCollection.bulkInsert(
      ticket_types.map((t) => ({
        ...t,
        service_id: newService.id,
      })),
    );
    if (error.length > 0) {
      setErrorMessages([
        "Nepodarilo sa vytvoriť niektoré typy lístkov, skúste znova",
      ]);
      return;
    }

    onSubmit ? onSubmit() : router.back();
  };

  const update = async (values: FormValues) => {
    if (!service) {
      console.error("Service is undefined");
      return;
    }

    if (!servicesCollection) {
      console.error("servicesCollection is undefined");
      return;
    }

    if (!ticketTypesCollection) {
      console.error("ticketTypesCollection is undefined");
      return;
    }

    if (!ticket_types) {
      console.error("ticket_types is undefined");
      return;
    }

    await service.incrementalPatch({ name: values.name });

    await ticketTypesCollection.bulkRemove(
      ticket_types
        .filter((tt) => !values.ticket_types.some((t) => t.id === tt.id))
        .map((tt) => tt.id!),
    );

    await ticketTypesCollection.bulkUpsert(
      values.ticket_types.map((t) => ({
        ...t,
        service_id: service.id,
      })),
    );

    onSubmit ? onSubmit() : router.back();
  };

  return (
    <>
      <Form
        form={form}
        onSubmit={service?.id ? update : create}
        className="flex flex-col gap-2"
      >
        <FormTextField
          form={form}
          name="name"
          label="Názov predstavenia"
          type="text"
          placeholder="Zadajte názov predstavenia"
        />
        <div className="flex items-center gap-6 pt-4">
          <p className="text-sm text-gray-600">Typy lístkov</p>
          <div className="h-px flex-grow bg-gray-400" />
        </div>
        <div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-2 text-start text-sm font-normal text-gray-500">
                  Názov typu
                </th>
                <th className="px-2 text-sm font-normal text-gray-500">
                  <div className="flex items-center gap-1">
                    Kapacita
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InformationCircleIcon className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Kapacita je nezáväzná, môžete ju kedykoľvek prekročiť.
                          Nechajte prázdne pre neobmedzenú.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </th>
                <th className="px-2 text-sm font-normal text-gray-500">
                  <div className="flex items-center gap-1">
                    Cena
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InformationCircleIcon className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Cena je nezáväzná a pri každom lístku ju viete zmeniť.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </th>
                <th className="px-1 text-start text-sm font-normal text-gray-500">
                  <div className="flex items-center gap-1">
                    VIP
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InformationCircleIcon className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Iba pre vašu referenciu, aby sa vám ľahšie rozlišovalo
                          medzi lístkami.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ticketTypesArrays.fields.map((ticket_type, index) => {
                const canDelete = !tickets?.some(
                  (t) => t.type_id === ticket_type.id,
                );
                return (
                  <tr key={ticket_type.id}>
                    <td className="px-1" valign="top">
                      <FormTextField
                        form={form}
                        name={`ticket_types.${index}.id`}
                        type="hidden"
                      />
                      <FormTextField
                        form={form}
                        name={`ticket_types.${index}.label`}
                        className="w-auto"
                      />
                    </td>
                    <td className="px-1" valign="top">
                      <FormTextField
                        form={form}
                        name={`ticket_types.${index}.capacity`}
                        type="number"
                        icons={{ start: <UserGroupIcon className="h-4 w-4" /> }}
                        placeholder="-"
                      />
                    </td>
                    <td className="px-1" valign="top">
                      <FormTextField
                        form={form}
                        name={`ticket_types.${index}.price`}
                        type="number"
                        icons={{
                          start: <CurrencyEuroIcon className="h-4 w-4" />,
                        }}
                      />
                    </td>
                    <td className="p-1 text-end" valign="top">
                      <FormSwitchField
                        form={form}
                        name={`ticket_types.${index}.is_vip`}
                      />
                    </td>
                    <td valign="top">
                      {ticketTypesArrays.fields.length > 1 && (
                        <button
                          type="button"
                          className="self-center p-2 text-red-600 transition-all enabled:hover:scale-110 enabled:hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
                          onClick={() => ticketTypesArrays.remove(index)}
                          title={
                            canDelete
                              ? "Vymyzať"
                              : "Nemôžete zmazať, typ je už použitý"
                          }
                          disabled={!canDelete}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ticketTypesArrays.fields.length === 0 && (
            <div className="flex items-center justify-center gap-2 p-2 text-yellow-500">
              <InformationCircleIcon className="h-4 w-4" />
              <p className="text-sm">
                Nevytvorili ste žiadne typy lístkov. Vytvorte aspoň 1 aby ste
                mohli predávať lístky
              </p>
            </div>
          )}
          <div className="p-1">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-1 text-sm font-medium text-gray-500 hover:bg-gray-200"
              type="button"
              onClick={() =>
                ticketTypesArrays.append({
                  id: crypto.randomUUID(),
                  label: "Standard",
                  price: 20,
                  is_vip: false,
                })
              }
            >
              <PlusIcon className="h-4 w-4" />
              Pridať typ lístka
            </button>
          </div>
        </div>
        <FormError form={form} name="ticket_types" />
        {errorMessages.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            {errorMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </Alert>
        )}
        {ticketTypesArrays.fields
          .map((t) => t.label)
          .some((t, i, a) => a.indexOf(t) != i) && (
          <Alert variant="warning" className="mt-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Rovnaké názvy typov lístkov</AlertTitle>
            <AlertDescription>
              Odporúčame zvoliť rôzne názvy typov lístkov.
            </AlertDescription>
          </Alert>
        )}
        <SubmitButton
          className="self-end"
          isSubmitting={form.formState.isSubmitting}
          label={service?.id ? "Uložiť" : "Vytvoriť"}
          submittingLabel={service?.id ? "Ukladám..." : "Vytváram..."}
        />
      </Form>
    </>
  );
}
