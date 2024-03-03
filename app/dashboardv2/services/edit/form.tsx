"use client";

import { useRxData } from "@/rxdb/db";
import {
  CustomErrorMessage,
  FormikCheckboxField,
  FormikTextField,
  SubmitButton,
} from "@/utils/forms/FormElements_dep";
import { FormikFieldSyncer } from "@/utils/forms/FormikElements";
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
    .min(1, "Musíte mať aspoň 1 typ lístka")
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
    useCallback((collection) => collection.findOne(serviceId), [serviceId]),
  );

  const { result: ticket_types, collection: ticketTypesCollection } = useRxData(
    "ticket_types",
    useCallback(
      (collection) => collection.find().where("service_id").eq(serviceId),
      [serviceId],
    ),
  );

  const initialValues: FormValues = {
    name: service?.name || initialTitle || "",
    ticket_types: ticket_types?.map((tt) => ({
      ...tt,
      capacity: tt.capacity || undefined,
    })) || [
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
    const newService = await servicesCollection.insert(serviceValues); // TODO: implement error handling
    const newTicketTypes = await ticketTypesCollection.bulkInsert(
      // TODO: implement error handling
      values.ticket_types.map((t) => ({
        ...t,
        service_id: newService.id!,
      })),
    );
    onSubmit ? onSubmit() : router.back();
  };

  const update = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>,
  ) => {
    // TODO implement transactions
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

    const deleteTicketTypes = async (ids: string[]) => {
      // TODO: Implement the logic to delete ticket types with the given ids
    };

    await deleteTicketTypes(ticketTypesToDeleteIds);

    ticketTypesCollection.bulkUpsert(
      values.ticket_types.map((t) => ({ ...t, service_id: service.id })),
    );

    // const ticketTypesToDelete = service.ticket_types
    //   .filter((ott) => !res.data.some((ntt) => ntt.id === ott.id))
    //   .map((t) => t.id);
    // const resDelete = await deleteTicketTypes(ticketTypesToDelete);
    // if (resDelete.error) {
    //   if (resDelete.error.message.includes("foreign key constraint")) {
    //     setErrorMessages([
    //       "Nepodarilo sa zmazať niektoré typy lístkov, pretože už sú použité",
    //     ]);
    //   } else {
    //     setErrorMessages([
    //       "Failed to delete ticketTypes: ",
    //       ...resDelete.error.message.split("\n"),
    //     ]);
    //   }
    //   refresh();
    //   return;
    // }
    // setPartialService({
    //   id: service.id,
    //   ticket_types: res.data,
    // });
    // toast.success("Predstavenie upravené!", { autoClose: 1500 });
    onSubmit ? onSubmit() : router.back();
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        // onSubmit={service?.id ? update : create}
        onSubmit={() => alert("Not implemented")}
        validationSchema={validationSchema}
      >
        {({ values, isSubmitting, getFieldMeta, setFieldValue }) => (
          <Form className="flex flex-col gap-2">
            <FormikTextField
              name="name"
              label="Názov predstavenia"
              vertical
              type="text"
            />
            <FormikFieldSyncer name="name" value={initialTitle} />
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
                            <Tooltip content="Cena je nezáväzná a pri každom lístku je viete zmeniť.">
                              <InformationCircleIcon className="h-4 w-4" />
                            </Tooltip>
                          </div>
                        </th>
                        <th className="px-1 text-start text-sm font-normal text-gray-500">
                          <div className="flex items-center gap-1">
                            VIP
                            <Tooltip content="Iba pre vašu referenciu, aby sa vám lahšie rozlyšovalo medzi lístkami.">
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
                          // const canDelete =
                          //   !!serviceId &&
                          //   allEvents.some(
                          //     (e) =>
                          //       e.service_id.toString() == serviceId &&
                          //       (e.tickets.some(
                          //         (t) => t.type_id == ticket_type.id,
                          //       ) ||
                          //         e.tickets.some(
                          //           (t) => t.type_id == ticket_type.id,
                          //         )),
                          //   );
                          return (
                            <tr key={index}>
                              <td className="px-1">
                                <Field
                                  name={`ticket_types[${index}].id`}
                                  type="hidden"
                                />
                                <FormikTextField
                                  name={`ticket_types[${index}].label`}
                                  vertical
                                />
                              </td>
                              <td className="px-1">
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
                              <td className="px-1">
                                <FormikTextField
                                  name={`ticket_types[${index}].price`}
                                  vertical
                                  type="number"
                                  iconStart={
                                    <CurrencyEuroIcon className="h-4 w-4" />
                                  }
                                />
                              </td>
                              <td className="p-1 text-end">
                                <FormikCheckboxField
                                  vertical
                                  name={`ticket_types[${index}].is_vip`}
                                />
                              </td>
                              <td>
                                {values.ticket_types.length > 1 && (
                                  <button
                                    type="button"
                                    className="self-center p-2 text-red-600 transition-all hover:scale-110 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:scale-100 disabled:hover:text-gray-300"
                                    onClick={() => remove(index)}
                                    title={
                                      // canDelete
                                      true
                                        ? "Nemôžete zmazať, typ je už použitý"
                                        : "Vymyzať"
                                    }
                                    disabled={
                                      // canDelete
                                      true
                                    }
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
