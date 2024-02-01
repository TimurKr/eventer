"use client";

import { Alert, Button, Checkbox, Datepicker, Modal } from "flowbite-react";
import { useContext, useRef, useState, useTransition } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useStore } from "zustand";
import { CouponsContext } from "./zustand";
import { v4 as uuidv4 } from "uuid";
import { Form, Formik } from "formik";
import { GenericTextField, SubmitButton } from "@/app/components/FormElements";
import * as Yup from "yup";
import { ArrowPathIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";

export default function NewCouponModal() {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const code = uuidv4().slice(0, 8).toUpperCase();

  const [isOpen, setIsOpen] = useState(false);

  const store = useContext(CouponsContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const { addCoupons } = useStore(store, (state) => state);

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
                await addCoupons([values]);
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
                <GenericTextField
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
                <GenericTextField
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
          {/* <form className="flex flex-col" action={submit}>
            <label className="mb-2" htmlFor="code">
              Kód
            </label>
            <input
              className="rounded-md border-gray-200 bg-transparent px-2 py-0.5"
              type="text"
              name="code"
              id="code"
              required
              defaultValue={code}
            />
            <label className="mb-2 mt-4" htmlFor="amount">
              Suma
            </label>
            <input
              className="rounded-md border-gray-200 bg-transparent px-2 py-0.5"
              type="number"
              name="amount"
              id="amount"
              required
              defaultValue="100"
            />

            <Button
              type="submit"
              size="sm"
              // className="mt-4 rounded-md bg-blue-600 py-1 text-white shadow-md hover:bg-blue-700 hover:shadow-none"
              isProcessing={isSubmitting}
            >
              {isSubmitting ? "Vytváram..." : "Vytvoriť"}
            </Button>
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
          </form> */}
        </Modal.Body>
      </Modal>
    </>
  );
}
