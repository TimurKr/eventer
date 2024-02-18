"use client";

import { Alert, Datepicker, Modal } from "flowbite-react";
import { useState } from "react";
import { insertEvents } from "../serverActions";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useStoreContext } from "../../store";
import { FormikSelectField, SubmitButton } from "@/utils/forms/FormElements";
import { Field, FieldProps, Form, Formik } from "formik";
import moment from "moment";

export default function NewEventModal() {
  const {
    events: { addEvent },
    services: { allServices },
  } = useStoreContext((state) => state);

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  if (allServices.length === 0) {
    return null;
  }

  return (
    <>
      <button
        color="success"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-cyan-700 px-2 py-1 text-sm text-white hover:bg-cyan-800"
      >
        <PlusIcon className="h-5 w-5" />
        Nová udalosť
      </button>
      <Modal show={isOpen} onClose={() => setIsOpen(false)} dismissible>
        <Modal.Header>Nová udalosť</Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              date: new Date().toDateString(),
              time: moment().startOf("hour").format("HH:mm"),
              isPublic: false,
              service_id: allServices[0].id,
            }}
            onSubmit={async (values) => {
              const datetime = new Date(
                values.date + " " + values.time,
              ).toISOString();
              const { data, error } = await insertEvents([
                {
                  datetime: new Date(
                    values.date + " " + values.time,
                  ).toISOString(),
                  is_public: values.isPublic,
                  service_id: values.service_id,
                },
              ]);
              if (error) {
                setErrorMessages(error.message.split("\n"));
                return;
              }
              addEvent({
                ...data[0],
                tickets: [],
                cancelled_tickets: [],
                isExpanded: true,
                lockedArrived: true,
                showCancelledTickets: false,
              });
              setIsOpen(false);
            }}
          >
            {({ setFieldValue, isSubmitting }) => (
              <Form className="flex flex-col">
                <div className="flex flex-col gap-4 md:flex-row">
                  <Datepicker
                    language="sk-SK"
                    showClearButton={false}
                    showTodayButton={false}
                    weekStart={1}
                    inline
                    color="red"
                    onSelectedDateChanged={(date) =>
                      setFieldValue("date", date.toDateString())
                    }
                    theme={{
                      popup: {
                        root: {
                          base: "!pt-0",
                          inner:
                            "!shadow-none border border-gray-200 rounded-lg bg-gray-50",
                        },
                        header: {
                          selectors: {
                            button: {
                              base: "rounded-lg text-gray-900 bg-gray-50 font-semibold py-2.5 px-5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 view-switch",
                            },
                          },
                        },
                      },
                    }}
                  />
                  <div className="flex flex-1 flex-col gap-4">
                    <FormikSelectField name="service_id">
                      {allServices.map((service) => (
                        <option value={service.id}>{service.name}</option>
                      ))}
                    </FormikSelectField>
                    <Field
                      name="time"
                      type="time"
                      className="rounded-lg border border-gray-200 bg-gray-50 py-1"
                      step={60}
                    />
                    <Field name="isPublic">
                      {(props: FieldProps) => (
                        <div className="mt-4 flex flex-1 flex-row justify-between">
                          <label htmlFor="is_public" className="ml-2">
                            Verejný
                          </label>
                          <input
                            type="checkbox"
                            id="is_public"
                            className="h-5 w-5 rounded-md border border-gray-200 bg-gray-50"
                            {...props.field}
                          />
                        </div>
                      )}
                    </Field>
                    <SubmitButton
                      isSubmitting={isSubmitting}
                      label="Vytvoriť"
                      submittingLabel="Vytváram..."
                    />
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
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </>
  );
}
