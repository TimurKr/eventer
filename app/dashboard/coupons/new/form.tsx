"use client";

import { Alert } from "flowbite-react";
import { useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { useStoreContext } from "../../store";
import { FormikTextField, SubmitButton } from "@/utils/forms/FormElements";
import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import { ArrowPathIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";

export default function NewCouponForm({ onSubmit }: { onSubmit?: () => void }) {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const { addCoupons } = useStoreContext((state) => state.coupons);
  const router = useRouter();

  return (
    <>
      <Formik
        initialValues={{
          code: uuidv4().slice(0, 8).toUpperCase(),
          amount: 100,
        }}
        onSubmit={async (values) => {
          try {
            await addCoupons([{ ...values, original_amount: values.amount }]);
          } catch (error) {
            setErrorMessages((error as Error).message.split("\n"));
            return;
          }
          onSubmit ? onSubmit() : router.back();
        }}
        validationSchema={Yup.object().shape({
          code: Yup.string()
            .required("Kód je povinný")
            .length(8, "Kód musí mať 8 znakov"),
          amount: Yup.number()
            .required("Suma je povinná")
            .min(0, "Suma musí byť kladná"),
        })}
      >
        {(formik) => (
          <Form className="flex flex-col gap-2">
            <FormikTextField
              name="code"
              label="Kód"
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
              iconStart={<CurrencyEuroIcon className="h-4 w-4" />}
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
            <p>{message}</p>
          ))}
        </Alert>
      )}
    </>
  );
}
