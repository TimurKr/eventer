"use client";

import { Alert, Modal } from "flowbite-react";
import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { v4 as uuidv4 } from "uuid";
import { Form, Formik } from "formik";
import { FormikTextField, SubmitButton } from "@/utils/forms/FormElements";
import * as Yup from "yup";
import { ArrowPathIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { useStoreContext } from "../../store";
import { insertServices } from "../serverActions";

export default function NewServiceModal() {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  const { addServices } = useStoreContext((state) => state.services);

  return (
    <>
      <button
        color="success"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-cyan-700 px-2 py-1 text-sm text-white hover:bg-cyan-800"
      >
        <PlusIcon className="h-5 w-5" />
        Nové predstavenie
      </button>
      <Modal show={isOpen} onClose={() => setIsOpen(false)} dismissible>
        <Modal.Header>Vytvorte si nové predstavenie</Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              name: "",
            }}
            onSubmit={async (values) => {
              const r = await insertServices([values]);
              if (r.error) {
                setErrorMessages(r.error.message.split("\n"));
                return;
              }
              addServices(r.data);
              setIsOpen(false);
            }}
            validationSchema={Yup.object().shape({
              name: Yup.string().required("Názov je povinný"),
            })}
          >
            {(formik) => (
              <Form className="flex flex-col gap-2">
                <FormikTextField name="name" label="Názov" type="text" />
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
