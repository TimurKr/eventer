"use client";

import {
  CustomErrorMessage,
  FormikCheckboxField,
  FormikTextField,
} from "@/components/forms/formik_dep/FormikElements";
import SubmitButton from "@/components/forms/SubmitButton";
import { useRxData } from "@/rxdb/db";
import {
  CurrencyEuroIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Alert, Tooltip } from "flowbite-react";
import { Field, FieldArray, Form, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Názov je povinný"),
  ticket_types: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string(),
        label: Yup.string()
          .required("Názov je povinný")
          .min(3, "Zadajte aspoň 3 znaky"),
        capacity: Yup.number().integer("Zadajte celé číslo"),
        price: Yup.number().required("Cena je povinná"),
        is_vip: Yup.boolean(),
      }),
    )
    .required("Musíte mať aspoň 1 typ lístka"),
});

type FormValues = Yup.InferType<typeof validationSchema>;

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

  const { result: ticket_types, collection: ticketTypesCollection } = useRxData(
    "ticket_types",
    useCallback(
      (collection) => collection.find().where("service_id").eq(serviceId),
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
  );

  const initialValues: FormValues = {
    name: service?.name || initialTitle || "",
    ticket_types: (service &&
      ticket_types?.map((tt) => ({
        ...tt._data,
        capacity: tt.capacity || undefined,
      }))) || [
      {
        id: undefined,
        label: "Standard",
        price: 20,
        capacity: 100,
        is_vip: false,
      },
    ],
  };

  const create = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>,
  ) => {
    if (!servicesCollection || !ticketTypesCollection) {
      console.error("Collections not found");
      return;
    }

    const { ticket_types: bin, ...serviceValues } = values;
    const newService = await servicesCollection.insert({
      ...serviceValues,
      id: crypto.randomUUID(),
    });
    const { success: newTicketTypes, error } =
      await ticketTypesCollection.bulkInsert(
        values.ticket_types.map((t) => ({
          ...t,
          service_id: newService.id,
          id: crypto.randomUUID(),
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

  const update = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>,
  ) => {
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
        id: t.id || crypto.randomUUID(),
      })),
    );

    onSubmit ? onSubmit() : router.back();
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={service?.id ? update : create}
        // onSubmit={() => alert("Not implemented")}
        validationSchema={validationSchema}
      >
        {({ values, isSubmitting, getFieldMeta, setFieldValue, errors }) => (
          <Form className="flex flex-col gap-2">
            <FormikTextField
              name="name"
              label="Názov predstavenia"
              vertical
              type="text"
            />
            <div className="flex items-center gap-6 pt-4">
              <p className="text-sm text-gray-600">Typy lístkov</p>
              <div className="h-px flex-grow bg-gray-400" />
            </div>
            <FieldArray name="ticket_types">
              {({ remove, push }) => (
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
                            <Tooltip content="Kapacita je nezáväzná, môžete ju kedykoľvek prekročiť. Nechajte prázdne pre neobmedzenú.">
                              <InformationCircleIcon className="h-4 w-4" />
                            </Tooltip>
                          </div>
                        </th>
                        <th className="px-2 text-sm font-normal text-gray-500">
                          <div className="flex items-center gap-1">
                            Cena
                            <Tooltip content="Cena je nezáväzná a pri každom lístku ju viete zmeniť.">
                              <InformationCircleIcon className="h-4 w-4" />
                            </Tooltip>
                          </div>
                        </th>
                        <th className="px-1 text-start text-sm font-normal text-gray-500">
                          <div className="flex items-center gap-1">
                            VIP
                            <Tooltip content="Iba pre vašu referenciu, aby sa vám ľahšie rozlišovalo medzi lístkami.">
                              <InformationCircleIcon className="h-4 w-4" />
                            </Tooltip>
                          </div>
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.ticket_types &&
                        values.ticket_types.map((ticket_type, index) => {
                          // TODO: implement canDelete
                          const canDelete = !tickets?.some(
                            (t) => t.type_id === ticket_type.id,
                          );
                          return (
                            <tr key={index}>
                              <td className="px-1" valign="top">
                                <Field
                                  name={`ticket_types[${index}].id`}
                                  type="hidden"
                                />
                                <FormikTextField
                                  name={`ticket_types[${index}].label`}
                                  vertical
                                />
                              </td>
                              <td className="px-1" valign="top">
                                <FormikTextField
                                  name={`ticket_types[${index}].capacity`}
                                  vertical
                                  type="number"
                                  iconStart={
                                    <UserGroupIcon className="h-4 w-4" />
                                  }
                                  optional
                                />
                              </td>
                              <td className="px-1" valign="top">
                                <FormikTextField
                                  name={`ticket_types[${index}].price`}
                                  vertical
                                  type="number"
                                  iconStart={
                                    <CurrencyEuroIcon className="h-4 w-4" />
                                  }
                                />
                              </td>
                              <td className="p-1 text-end" valign="top">
                                <FormikCheckboxField
                                  vertical
                                  name={`ticket_types[${index}].is_vip`}
                                />
                              </td>
                              <td valign="top">
                                {values.ticket_types.length > 1 && (
                                  <button
                                    type="button"
                                    className="self-center p-2 text-red-600 transition-all enabled:hover:scale-110 enabled:hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
                                    onClick={() => remove(index)}
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
                  {values.ticket_types.length === 0 && (
                    <div className="flex items-center justify-center gap-2 p-2 text-yellow-500">
                      <InformationCircleIcon className="h-4 w-4" />
                      <p className="text-sm">
                        Nevytvorili ste žiadne typy lístkov. Vytvorte aspoň 1
                        aby ste mohli predávať lístky
                      </p>
                    </div>
                  )}
                  <div className="p-1">
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-1 text-sm font-medium text-gray-500 hover:bg-gray-200"
                      type="button"
                      onClick={() =>
                        push({
                          label: "Standard",
                          price: "",
                          is_vip: false,
                        })
                      }
                    >
                      <PlusIcon className="h-4 w-4" />
                      Pridať typ lístka
                    </button>
                  </div>
                </div>
              )}
            </FieldArray>
            <CustomErrorMessage fieldMeta={getFieldMeta("ticket_types")} />
            <div>
              <SubmitButton
                className="ms-auto"
                isSubmitting={isSubmitting}
                label={service?.id ? "Uložiť" : "Vytvoriť"}
                submittingLabel={service?.id ? "Ukladám..." : "Vytváram..."}
              />
            </div>
          </Form>
        )}
      </Formik>
      {errorMessages.length > 0 && (
        <Alert
          color="failure"
          className="mt-4"
          icon={HiOutlineExclamationCircle}
        >
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </Alert>
      )}
    </>
  );
}
