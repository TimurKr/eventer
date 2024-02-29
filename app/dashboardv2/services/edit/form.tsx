"use client";

import {
  CustomErrorMessage,
  FormikCheckboxField,
  FormikTextField,
  SubmitButton,
} from "@/utils/forms/FormElements";
import {
  CurrencyEuroIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Alert, Tooltip } from "flowbite-react";
import { Field, FieldArray, Form, Formik, useFormikContext } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import * as Yup from "yup";

export type ServiceFormProps = {
  serviceId?: string;
  initialTitle?: string;
};

function FieldSyncer({ name, value }: { name: string; value: any }) {
  const { setFieldValue, getFieldMeta } = useFormikContext();
  const touched = getFieldMeta(name).touched;
  useEffect(() => {
    if (!touched) setFieldValue(name, value);
  }, [value, name, setFieldValue, touched]);
  return null;
}

export default function ServiceForm({
  serviceId,
  initialTitle,
  onSubmit,
}: ServiceFormProps & { onSubmit?: () => void }) {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const router = useRouter();

  // const service = allServices.find((s) => s.id.toString() == serviceId);

  // const { result: service } = useRxData<ServicesDocumentType>( // Is service a list???
  //   "services",
  //   useCallback((collection) => collection.findOne(serviceId), [serviceId]),
  // );

  // const { result: ticket_types } = useRxData<TicketTypesDocumentType>(
  //   "ticket_types",
  //   useCallback(
  //     (collection) => collection.find().where("service_id").eq(serviceId),
  //     [serviceId],
  //   ),
  // );

  const service = undefined;
  const ticket_types = [];

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Názov je povinný"),
    ticket_types: Yup.array()
      .of(
        Yup.object().shape({
          id: Yup.number(),
          label: Yup.string()
            .required("Názov je povinný")
            .min(3, "Zadajte aspoň 3 znaky"),
          capacity: Yup.number().integer("Zadajte celé číslo").nullable(),
          price: Yup.number().required("Cena je povinná"),
          is_vip: Yup.boolean(),
        }),
      )
      .min(1, "Musíte mať aspoň 1 typ lístka")
      .required("Musíte mať aspoň 1 typ lístka"),
  });

  type FormValues = Yup.InferType<typeof validationSchema>;

  // const create = async (
  //   values: FormValues,
  //   helpers: FormikHelpers<FormValues>,
  // ) => {
  //   // TODO: implement transaction
  //   const { ticket_types: bin, ...serviceValues } = values;
  //   const resServices = await insertServices([serviceValues]);
  //   if (resServices.error) {
  //     if (
  //       resServices.error.message.includes("services_unique_name_constraint")
  //     ) {
  //       setErrorMessages([]);
  //       helpers.setFieldError(
  //         "name",
  //         "Už máte jedno predstavenie s týmto názvom",
  //       );
  //     } else {
  //       setErrorMessages(resServices.error.message.split("\n"));
  //     }
  //     return;
  //   }
  //   const resTicketTypes = await insertTicketTypes(
  //     values.ticket_types.map((t) => ({
  //       ...t,
  //       service_id: resServices.data[0].id,
  //     })),
  //   );
  //   if (resTicketTypes.error) {
  //     const res = await deleteService(resServices.data[0].id);
  //     if (res.error) {
  //       console.error(res.error);
  //       toast.error("Nepodarilo sa vytvoriť typy lístkov");
  //       router.back();
  //     }
  //     setErrorMessages(resTicketTypes.error.message.split("\n"));
  //     return;
  //   }
  //   addServices([
  //     { ...resServices.data[0], ticket_types: resTicketTypes.data },
  //   ]);
  //   toast.success("Predstavenie vytvorené!", { autoClose: 1500 });
  //   onSubmit ? onSubmit() : router.back();
  // };

  // const update = async (
  //   values: FormValues,
  //   helpers: FormikHelpers<FormValues>,
  // ) => {
  //   // TODO implement transactions
  //   if (!service) return;
  //   if (service.name !== values.name) {
  //     const res = await updateService({
  //       id: service.id,
  //       name: values.name,
  //     });
  //     if (res.error) {
  //       setErrorMessages(res.error.message.split("\n"));
  //       return;
  //     }
  //     setPartialService(res.data[0]);
  //   }
  //   const res = await bulkUpsertTicketTypes(
  //     values.ticket_types.map((t) => ({ ...t, service_id: service.id })),
  //   );
  //   if (res.error) {
  //     setErrorMessages(res.error.message.split("\n"));
  //     return;
  //   }

  //   const ticketTypesToDelete = service.ticket_types
  //     .filter((ott) => !res.data.some((ntt) => ntt.id === ott.id))
  //     .map((t) => t.id);
  //   const resDelete = await deleteTicketTypes(ticketTypesToDelete);
  //   if (resDelete.error) {
  //     if (resDelete.error.message.includes("foreign key constraint")) {
  //       setErrorMessages([
  //         "Nepodarilo sa zmazať niektoré typy lístkov, pretože už sú použité",
  //       ]);
  //     } else {
  //       setErrorMessages([
  //         "Failed to delete ticketTypes: ",
  //         ...resDelete.error.message.split("\n"),
  //       ]);
  //     }
  //     refresh();
  //     return;
  //   }
  //   setPartialService({
  //     id: service.id,
  //     ticket_types: res.data,
  //   });
  //   toast.success("Predstavenie upravené!", { autoClose: 1500 });
  //   onSubmit ? onSubmit() : router.back();
  // };

  return (
    <>
      <Formik
        initialValues={
          (service !== undefined
            ? {
                ...service,
                ticket_types: ticket_types.map((t) => ({
                  ...t,
                  capacity: t.capacity || undefined,
                })),
              }
            : {
                name: initialTitle || "",
                ticket_types: [
                  {
                    id: undefined,
                    label: "Standard",
                    price: 20,
                    capacity: 100,
                    is_vip: false,
                  },
                ],
              }) as FormValues
        }
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
            <FieldSyncer name="name" value={initialTitle} />
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
