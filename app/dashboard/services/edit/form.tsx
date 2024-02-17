"use client";

import { Alert } from "flowbite-react";
import { useState } from "react";
import { Field, FieldArray, Form, Formik } from "formik";
import {
  CustomErrorMessage,
  FormikCheckboxField,
  FormikTextField,
  SubmitButton,
} from "@/utils/forms/FormElements";
import * as Yup from "yup";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { useStoreContext } from "../../store";
import {
  Services,
  bulkUpsertTicketTypes,
  deleteService,
  insertServices,
  insertTicketTypes,
  updateService,
} from "../serverActions";
import { useRouter } from "next/navigation";
import {
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

export default function NewServiceForm({ serviceId }: { serviceId?: string }) {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const router = useRouter();

  const { addServices, allServices, setPartialService } = useStoreContext(
    (state) => state.services,
  );
  const service = allServices.find((s) => s.id.toString() == serviceId);

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

  const create = async (values: FormValues) => {
    const { ticket_types: bin, ...serviceValues } = values;
    const resServices = await insertServices([serviceValues]);
    if (resServices.error) {
      setErrorMessages(resServices.error.message.split("\n"));
      return;
    }
    const resTicketTypes = await insertTicketTypes(
      values.ticket_types.map((t) => ({
        ...t,
        service_id: resServices.data[0].id,
      })),
    );
    if (resTicketTypes.error) {
      const res = await deleteService(resServices.data[0].id);
      if (res.error) {
        console.error(res.error);
        toast.error("Nepodarilo sa vytvoriť typy lístkov");
        router.back();
      }
      setErrorMessages(resTicketTypes.error.message.split("\n"));
      return;
    }
    addServices([
      { ...resServices.data[0], ticket_types: resTicketTypes.data },
    ]);
    router.back();
  };

  const update = async (values: FormValues) => {
    if (!service) return;
    if (service.name !== values.name) {
      const res = await updateService({
        id: service.id,
        name: values.name,
      });
      if (res.error) {
        setErrorMessages(res.error.message.split("\n"));
        return;
      }
      setPartialService(res.data[0]);
    }
    const res = await bulkUpsertTicketTypes(
      values.ticket_types.map((t) => ({ ...t, service_id: service.id })),
    );
    if (res.error) {
      setErrorMessages(res.error.message.split("\n"));
      return;
    }
    setPartialService({
      id: service.id,
      ticket_types: res.data,
    });
    router.back();
  };

  return (
    <>
      <Formik
        initialValues={
          service !== undefined
            ? service
            : {
                name: "",
                ticket_types: [
                  {
                    id: undefined,
                    label: "Standard",
                    price: 20,
                    capacity: 100,
                    is_vip: false,
                  },
                ],
              }
        }
        onSubmit={async (values) => {
          service?.id ? update(values) : create(values);
        }}
        validationSchema={validationSchema}
      >
        {({ values, isSubmitting, getFieldMeta }) => (
          <Form className="flex flex-col gap-2">
            <FormikTextField
              name="name"
              label="Názov Predstavenia"
              vertical
              type="text"
            />
            <hr className="my-4" />
            <p>Typy lístkov:</p>
            <FieldArray name="ticket_types">
              {({ remove, push }) => (
                <div>
                  <table className="w-full">
                    <tr>
                      <th className="px-2 text-start text-sm font-normal text-gray-500">
                        Názov typu
                      </th>
                      <th className="px-2 text-start text-sm font-normal text-gray-500">
                        Kapacita
                      </th>
                      <th className="px-2 text-start text-sm font-normal text-gray-500">
                        Cena
                      </th>
                      <th className="px-1 text-start text-sm font-normal text-gray-500">
                        VIP
                      </th>
                      <th></th>
                    </tr>
                    {values.ticket_types &&
                      values.ticket_types.map((ticket_type, index) => (
                        <tr>
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
                              iconStart={<UserGroupIcon className="h-4 w-4" />}
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
                          <td className="p-1">
                            <FormikCheckboxField
                              name={`ticket_types[${index}].is_vip`}
                            />
                          </td>
                          <td>
                            {values.ticket_types.length > 1 && (
                              <button
                                className="self-center p-2 text-red-600 hover:text-red-700"
                                onClick={() => remove(index)}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </table>
                  <div className="p-1">
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-1 text-sm font-medium text-gray-500 hover:bg-gray-200"
                      type="button"
                      onClick={() => push({ label: "Standard" })}
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
            <p>{message}</p>
          ))}
        </Alert>
      )}
    </>
  );
}
