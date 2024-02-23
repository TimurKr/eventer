"use client";

import {
  FormikCheckboxField,
  FormikSelectField,
  SubmitButton,
} from "@/utils/forms/FormElements";
import { Alert, Datepicker } from "flowbite-react";
import { Field, Form, Formik } from "formik";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useStoreContext } from "../../store_dep";
import { insertEvent, updateEvent } from "../serverActions";

export type EditEventFormProps = {
  eventId?: string;
};

export default function EditEventForm(
  props?: EditEventFormProps & { onSubmit?: () => void },
) {
  const {
    events: { addEvent, setPartialEvent, removeEvent },
    services: { allServices },
    event,
  } = useStoreContext((state) => ({
    ...state,
    event: state.events.allEvents.find(
      (e) => e.id.toString() === props?.eventId,
    ),
  }));

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const router = useRouter();

  if (allServices.length === 0) {
    return null;
  }

  const initialValues = {
    date: new Date().toDateString(),
    time: moment().startOf("hour").format("HH:mm"),
    isPublic: false,
    service_id: event?.service_id || allServices[0].id,
  };

  type Values = typeof initialValues;

  const create = async (values: Values) => {
    const { data, error } = await insertEvent({
      datetime: new Date(values.date + " " + values.time).toISOString(),
      is_public: values.isPublic,
      service_id: values.service_id,
    });
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
    toast.success("Udalosť vytvorená!", { autoClose: 1500 });
    props?.onSubmit ? props.onSubmit() : router.back();
  };

  const update = async (values: Values) => {
    const { data, error } = await updateEvent({
      id: event!.id,
      datetime: new Date(values.date + " " + values.time).toISOString(),
      is_public: values.isPublic,
      service_id: values.service_id,
    });
    if (error) {
      setErrorMessages(error.message.split("\n"));
      return;
    }
    setPartialEvent(data[0]);
    toast.success("Udalosť upravená!", { autoClose: 1500 });
    props?.onSubmit ? props.onSubmit() : router.back();
  };

  return (
    <Formik
      initialValues={{
        date: event
          ? new Date(event.datetime).toDateString()
          : new Date().toDateString(),
        time: event
          ? moment(event.datetime).startOf("hour").format("HH:mm")
          : moment().startOf("hour").format("HH:mm"),
        isPublic: event?.is_public || false,
        service_id: event?.service_id || allServices[0].id,
      }}
      onSubmit={event ? update : create}
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
              {!event && (
                <FormikSelectField name="service_id">
                  {allServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </FormikSelectField>
              )}
              <Field
                name="time"
                type="time"
                className="rounded-lg border border-gray-200 bg-gray-50 py-1"
                step={60}
              />
              <FormikCheckboxField name="isPublic" label="Verejný" />
              <SubmitButton
                isSubmitting={isSubmitting}
                label={event?.id ? "Uložiť" : "Vytvoriť"}
                submittingLabel={event?.id ? "Ukladám" : "Vytváram..."}
                className="mt-auto"
              />
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
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
