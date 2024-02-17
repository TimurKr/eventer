"use client";

import { Alert } from "flowbite-react";
import { useState } from "react";
import { Field, FieldArray, Form, Formik } from "formik";
import { FormikTextField, SubmitButton } from "@/utils/forms/FormElements";
import * as Yup from "yup";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { useStoreContext } from "../../store";
import { insertServices } from "../serverActions";
import { useRouter } from "next/navigation";

export default function NewServiceForm() {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const router = useRouter();

  const { addServices } = useStoreContext((state) => state.services);

  return (
    <>
      <Formik
        initialValues={{
          name: "",
          // ticket_types: [],
        }}
        onSubmit={async (values) => {
          const r = await insertServices([values]);
          if (r.error) {
            setErrorMessages(r.error.message.split("\n"));
            return;
          }
          addServices(r.data.map((d) => ({ ...d, ticket_types: [] })));
          router.back();
        }}
        validationSchema={Yup.object().shape({
          name: Yup.string().required("Názov je povinný"),
          // ticket_types: Yup.array().of(
          //   Yup.object().shape({
          //     label: Yup.string().required("Názov je povinný"),
          //     capacity: Yup.number().required("Kapacita je povinná"),
          //     price: Yup.number().required("Cena je povinná"),
          //     is_vip: Yup.boolean(),
          //   }),
          // ),
        })}
      >
        {(formik) => (
          <Form className="flex flex-col gap-2">
            <FormikTextField name="name" label="Názov" type="text" />
            {/* <FieldArray name="ticket_types">
              {({}) => (
                <div>
                  {formik.values.ticket_types.map((_, i) => (
                    <div key={i} className="flex gap-2">
                      <FormikTextField
                        name={`ticket_types.${i}.label`}
                        label="Názov"
                        type="text"
                      />
                      <FormikTextField
                        name={`ticket_types.${i}.capacity`}
                        label="Kapacita"
                        type="number"
                      />
                      <FormikTextField
                        name={`ticket_types.${i}.price`}
                        label="Cena"
                        type="number"
                      />
                      <Field
                        name={`ticket_types.${i}.is_vip`}
                        label="VIP"
                        type="checkbox"
                      />
                    </div>
                  ))}
                </div>
              )}
            </FieldArray> */}
            <div>
              <SubmitButton
                className="ms-auto"
                isSubmitting={formik.isSubmitting}
                label="Vytvoriť"
                submittingLabel="Vytváram"
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
