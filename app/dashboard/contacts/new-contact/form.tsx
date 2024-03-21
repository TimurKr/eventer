"use client";

import { FormikTextField } from "@/components/forms/FormikElements";
import SubmitButton from "@/components/forms/SubmitButton";
import { useRxCollection } from "@/rxdb/db";
import { Form, Formik, FormikProps } from "formik";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";

const validationSchema = Yup.object({
  name: Yup.string().required().min(2, "Zadajte aspoň 2 znaky"),
  email: Yup.string().email("Zadajte platný email").default(""),
  phone: Yup.string().default(""),
});

type Values = Yup.InferType<typeof validationSchema>;

export default function NewContactForm(initValues?: Partial<Values>) {
  const router = useRouter();

  const contactsCollection = useRxCollection("contacts");

  const initialValues: Values = {
    name: "",
    email: "",
    phone: "",
    ...initValues,
  };

  const onSubmit = useCallback(
    async (values: Values) => {
      if (!contactsCollection) return;

      const existingContact = await contactsCollection
        .findOne({
          selector: values,
        })
        .exec();

      if (existingContact) {
        toast.error("Kontakt už existuje");
        return;
      }

      const newContact = await contactsCollection.insert({
        ...values,
        id: crypto.randomUUID(),
      });

      toast.success("Lístky boli vytvorené", { autoClose: 1500 });
      router.push(`/dashboard/contacts/${newContact.id}`);
    },
    [contactsCollection, router],
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({
        values,
        isSubmitting,
        errors,
        getFieldMeta,
        getFieldHelpers,
        setFieldValue,
      }: FormikProps<Values>) => (
        <Form className="flex flex-col gap-2">
          <FormikTextField
            name="name"
            label="Meno"
            placeHolder="Meno"
            optional
            vertical
          />
          <FormikTextField
            name="email"
            label="Email"
            placeHolder="Email"
            optional
            vertical
          />
          <FormikTextField
            name="phone"
            label="Telefón"
            placeHolder="Telefón"
            optional
            vertical
          />
          <SubmitButton
            isSubmitting={isSubmitting}
            label="Vytvoriť"
            submittingLabel="Vytváram..."
            className="w-full"
          />
        </Form>
      )}
    </Formik>
  );
}
