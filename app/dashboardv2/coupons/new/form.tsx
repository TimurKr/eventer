"use client";

import {
  CustomComboBox,
  CustomDatePicker,
  CustomErrorMessage,
  FormikTextField,
  SubmitButton,
} from "@/utils/forms/FormElements_dep";
import {
  ArrowPathIcon,
  CurrencyEuroIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Alert } from "flowbite-react";
import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import { Contacts, bulkUpsertContacts } from "../../events/serverActions";
import { useStoreContext } from "../../store_dep";
import { Coupons, insertCoupons } from "../serverActions";
import { validateCoupon } from "../utils";

export default function NewCouponForm(props: { onSubmit?: () => void }) {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const { addCoupons, contacts, refresh } = useStoreContext((state) => ({
    addCoupons: state.coupons.addCoupons,
    contacts: state.events.contacts,
    refresh: state.events.refresh,
  }));
  const router = useRouter();

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

  const onSubmit = async (
    values: Values,
  ): Promise<
    | { error: { message: string; field?: string }; data?: undefined }
    | { data: Coupons; error?: undefined }
  > => {
    let contact:
      | NonNullable<
          Awaited<ReturnType<typeof bulkUpsertContacts>>["data"]
        >[number]
      | undefined;
    if (values.contact.name) {
      const { data: contacts, error } = await bulkUpsertContacts([
        {
          name: values.contact.name,
          email: values.contact.email,
          phone: values.contact.phone,
        },
      ]);
      if (error) {
        return {
          error: {
            message:
              "Chyba pri vytváraní fakturačného kontaktu: " + error.message,
          },
        };
      }

      contact = contacts[0];
      if (!contacts.find((c) => c.id === contact!.id)) {
        refresh();
      }
    }
    const { data: coupons, error } = await insertCoupons([
      {
        code: values.code,
        amount: values.amount,
        note: values.note,
        original_amount: values.amount,
        contact_id: contact?.id || null,
      }, // TODO: valid_until
    ]);
    if (error) {
      if (error.message.includes("coupons_code_key")) {
        return {
          error: {
            message: "Kód už existuje, vygenerujte nový",
            field: "code",
          },
        };
      }
      return { error: { message: error.message } };
    }
    return {
      data: {
        ...coupons[0],
        valid: validateCoupon(coupons[0]),
        created_from: [],
        redeemed_from: [],
        contact_id: contact?.id || null,
      },
    };
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

          const { data: coupon, error } = await onSubmit(values);
          if (error) {
            if (error.field) helpers.setFieldError(error.field, error.message);
            else setErrorMessages([error.message]);
            return;
          }
          addCoupons([coupon]);

          toast.success("Kupóny boli vytvorené", { autoClose: 1500 });
          props.onSubmit ? props.onSubmit() : router.back();
        }}
        validationSchema={validationSchema}
      >
        {(formik) => (
          <Form className="flex flex-col gap-2">
            <FormikTextField
              name="code"
              label="Kód"
              vertical
              iconEnd={
                <ArrowPathIcon
                  className="h-4 w-4 hover:scale-105 hover:cursor-pointer"
                  onClick={() =>
                    formik.setFieldValue(
                      "code",
                      uuidv4().slice(0, 8).toUpperCase(),
                    )
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
              value={formik.values.valid_until}
              onChange={(date) => formik.setFieldValue("valid_until", date)}
              label="Platný do"
              vertical
            />
            <hr className="my-2" />
            <CustomComboBox
              options={contacts as Partial<Contacts>[]}
              displayFun={(c) => c?.name || ""}
              searchKeys={["name"]}
              newValueBuilder={(input) => ({ name: input })}
              onSelect={async (contact) => {
                await formik.setFieldValue("contact.name", contact.name, true);
                if (contact.id) {
                  await formik.setFieldValue(
                    "contact.email",
                    contact.email,
                    true,
                  );
                  await formik.setFieldValue(
                    "contact.phone",
                    contact.phone,
                    true,
                  );
                }
              }}
              optional
              label="Meno"
              placeholder="Adam Kováč"
              vertical
              iconStart={<UserCircleIcon className="h-4 w-4 text-gray-500" />}
              error={
                <CustomErrorMessage
                  fieldMeta={formik.getFieldMeta("contact.name")}
                />
              }
            />
            <FormikTextField
              name="contact.email"
              label="Email"
              placeHolder="adam.kovac@gmail.com"
              optional
              vertical
            />
            <FormikTextField
              name="contact.phone"
              label="Telefón"
              placeHolder="0900 123 456"
              optional
              vertical
            />
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
            <p key={message}>{message}</p>
          ))}
        </Alert>
      )}
    </>
  );
}
