"use client";

import { useRxCollection, useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import CustomComboBox from "@/utils/forms/ComboBox";
import CustomDatePicker from "@/utils/forms/DatePicker";
import {
  CustomErrorMessage,
  FormikTextField,
} from "@/utils/forms/FormikElements";
import SubmitButton from "@/utils/forms/SubmitButton";
import {
  ArrowPathIcon,
  CurrencyEuroIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Alert } from "flowbite-react";
import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";

export default function NewCouponForm(props: { onSubmit?: () => void }) {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const router = useRouter();

  const { result: contacts, collection: contactsCollection } = useRxData(
    "contacts",
    useCallback((collection) => collection.find(), []),
    { initialResult: [] },
  );

  const couponsCollection = useRxCollection("coupons");

  const validationSchema = Yup.object().shape({
    code: Yup.string()
      .required("Kód je povinný")
      .length(8, "Kód musí mať 8 znakov"),
    amount: Yup.number()
      .required("Suma je povinná")
      .min(0, "Suma musí byť kladná"),
    note: Yup.string(),
    valid_until: Yup.date().required().nullable(),
    contact: Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email("Neplatný email"),
      phone: Yup.string(),
    }),
  });

  type Values = Yup.InferType<typeof validationSchema>;

  const initialValues: Values = {
    code: uuidv4().slice(0, 8).toUpperCase(),
    amount: 100,
    note: "",
    valid_until: null,
    contact: {
      name: "",
      email: "",
      phone: "",
    },
  };

  const onSubmit = async (values: Values) => {
    if (!contactsCollection || !couponsCollection) return;
    let contact: ContactsDocument | null = null;

    if (values.contact.name) {
      contact = await contactsCollection
        .findOne({
          selector: {
            name: values.contact.name,
            email: values.contact.email,
            phone: values.contact.phone,
          },
        })
        .exec();

      if (!contact) {
        contact = await contactsCollection.insert({
          id: crypto.randomUUID(),
          name: values.contact.name,
          email: values.contact.email,
          phone: values.contact.phone,
        });
      }
    }

    couponsCollection.insert({
      id: crypto.randomUUID(),
      code: values.code,
      amount: values.amount,
      note: values.note,
      original_amount: values.amount,
      contact_id: contact?.id,
    }); // TODO: valid_until
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        onSubmit={async (values, helpers) => {
          if (
            !values.contact.name &&
            !confirm(
              "Naozaj chcete vytvoriť kupón bez mena? Kupón nebude priradený k žiadnemu kontaktu.",
            )
          )
            return;

          await onSubmit(values);

          toast.success("Kupóny boli vytvorené", { autoClose: 1500 });
          props.onSubmit ? props.onSubmit() : router.back();
        }}
        validationSchema={validationSchema}
      >
        {({ values, isSubmitting, setFieldValue, getFieldMeta }) => (
          <Form className="flex flex-col gap-2">
            <CustomComboBox
              options={contacts.map((c) => {
                const { _attachments, _deleted, _meta, _rev, ...data } =
                  c._data;
                return data;
              })}
              displayFun={(c) => c?.name || ""}
              searchKeys={["name"]}
              newValueBuilder={(input) => ({
                name: input,
                email: "",
                phone: "",
                id: crypto.randomUUID(),
              })}
              onSelect={async (contact) => {
                await setFieldValue("contact.name", contact?.name || "", true);
                if (contact?.id) {
                  await setFieldValue(
                    "contact.email",
                    contact?.email || "",
                    true,
                  );
                  await setFieldValue(
                    "contact.phone",
                    contact?.phone || "",
                    true,
                  );
                }
                console.log(values);
              }}
              label="Meno"
              placeholder="Adam Kováč"
              vertical
              iconStart={<UserCircleIcon className="h-4 w-4 text-gray-500" />}
              error={
                <CustomErrorMessage fieldMeta={getFieldMeta("billingName")} />
              }
            />

            <FormikTextField
              // type="email"
              name="contact.email"
              label="Email"
              placeHolder="-"
              optional
              vertical
            />
            <FormikTextField
              name="contact.phone"
              label="Telefón"
              placeHolder="-"
              optional
              vertical
            />
            <FormikTextField
              name="code"
              label="Kód"
              vertical
              iconEnd={
                <ArrowPathIcon
                  className="h-4 w-4 hover:scale-105 hover:cursor-pointer"
                  onClick={() =>
                    setFieldValue("code", uuidv4().slice(0, 8).toUpperCase())
                  }
                />
              }
            />
            <FormikTextField
              name="amount"
              label="Suma"
              type="number"
              vertical
              iconStart={<CurrencyEuroIcon className="h-4 w-4" />}
            />
            <FormikTextField name="note" label="Poznámka" optional vertical />
            <CustomDatePicker
              value={values.valid_until}
              onChange={(date) => setFieldValue("valid_until", date)}
              label="Platný do"
              vertical
            />
            <hr className="my-2" />
            <div>
              <SubmitButton
                className="ms-auto"
                isSubmitting={isSubmitting}
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
            <p key={message}>{message}</p>
          ))}
        </Alert>
      )}
    </>
  );
}
