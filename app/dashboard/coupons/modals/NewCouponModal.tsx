"use client";

import { Alert, Modal } from "flowbite-react";
import { useContext, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useStore } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Form, Formik } from "formik";
import { FormikTextField, SubmitButton } from "@/app/components/FormElements";
import * as Yup from "yup";
import { ArrowPathIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { useStoreContext } from "../../store";

export default function NewCouponModal() {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  const { addCoupons } = useStoreContext((state) => state.coupons);

  return (
    <>
      <button
        color="success"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-cyan-700 px-2 py-1 text-sm text-white hover:bg-cyan-800"
      >
        <PlusIcon className="h-5 w-5" />
        Nový kupón
      </button>
      <Modal show={isOpen} onClose={() => setIsOpen(false)} dismissible>
        <Modal.Header>Vytvorte nový kupón</Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              code: uuidv4().slice(0, 8).toUpperCase(),
              amount: 100,
            }}
            onSubmit={async (values) => {
              try {
                await addCoupons([
                  { ...values, original_amount: values.amount },
                ]);
              } catch (error) {
                setErrorMessages((error as Error).message.split("\n"));
                return;
              }
              setIsOpen(false);
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
        </Modal.Body>
      </Modal>
    </>
  );
}
