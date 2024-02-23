"use client";

import { FormikTextField, SubmitButton } from "@/utils/forms/FormElements";
import { ArrowPathIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";
import { Alert } from "flowbite-react";
import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import { useStoreContext } from "../../store";
import { insertCoupons } from "../serverActions";
import { validateCoupon } from "../utils";

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
        onSubmit={async (values, helpers) => {
          const { data: coupons, error } = await insertCoupons([
            { ...values, original_amount: values.amount },
          ]);
          if (error) {
            if (error.message.includes("coupons_code_key")) {
              helpers.setFieldError(
                "code",
                "Kód už existuje, vygenerujte nový",
              );
            } else {
              setErrorMessages([error.message]);
            }
            return;
          }
          addCoupons(
            coupons.map((c) => ({
              ...c,
              valid: validateCoupon(c),
              created_from: [],
              redeemed_from: [],
            })),
          );
          toast.success("Kupóny boli vytvorené", { autoClose: 1500 });
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
            <p key={message}>{message}</p>
          ))}
        </Alert>
      )}
    </>
  );
}
