"use client";

import { Alert, Button, Datepicker, Modal } from "flowbite-react";
import { useState, useTransition } from "react";
import { updateEventFields } from "../serverActions";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { Events } from "@/utils/supabase/database.types";
import { SubmitButton } from "@/utils/forms/FormElements";
import { useStoreContext } from "../../store";

export default function ChangeDateModal({ event }: { event: Events }) {
  const [date, setDate] = useState<Date>(new Date(event.datetime));
  const [isSubmitting, startSubmition] = useTransition();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  const { setPartialEvent } = useStoreContext((state) => state.events);

  const submit = () => {
    startSubmition(async () => {
      const { data, error } = await updateEventFields({
        id: event.id,
        datetime: date.toISOString(),
      });
      if (error) {
        setErrorMessages(error.message.split("\n"));
        return;
      }
      setPartialEvent({ id: event.id, datetime: date.toISOString() });
      setIsOpen(false);
    });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        outline
        size="xs"
        className="me-auto"
      >
        Zmeniť termín
      </Button>
      <Modal show={isOpen} onClose={() => setIsOpen(false)} dismissible>
        <Modal.Header>Zvolťe nový termín</Modal.Header>
        <Modal.Body>
          <form className="flex flex-col" action={submit}>
            <div className="flex flex-col gap-4 md:flex-row">
              <Datepicker
                language="sk-SK"
                showClearButton={false}
                showTodayButton={false}
                weekStart={1}
                inline
                className="rounded-lg border border-gray-200 bg-white shadow-md"
                color="red"
                defaultDate={date}
                onSelectedDateChanged={(d) =>
                  setDate(
                    new Date(
                      d.toDateString() + " " + date.toLocaleTimeString("sk-SK"),
                    ),
                  )
                }
              />
              <div className="flex flex-1 flex-col">
                <input
                  type="time"
                  className="rounded-lg border border-gray-200 shadow-md"
                  value={date.toLocaleTimeString("sk-SK")}
                  onChange={(e) =>
                    setDate(
                      new Date(date.toDateString() + " " + e.target.value),
                    )
                  }
                />
                <SubmitButton
                  isSubmitting={isSubmitting}
                  label="Uložiť"
                  submittingLabel="Ukladám..."
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
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}
