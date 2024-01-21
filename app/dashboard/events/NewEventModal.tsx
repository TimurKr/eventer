"use client";

import { Alert, Button, Checkbox, Datepicker, Modal } from "flowbite-react";
import { useState, useTransition } from "react";
import { EventWithTickets, createNewEvent } from "./serverActions";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Updater } from "use-immer";
import { Events, Tickets } from "@/utils/supabase/database.types";

export default function NewEventModal({
  setEvents,
}: {
  setEvents: Updater<EventWithTickets[]>;
}) {
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("18:00");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isSubmitting, startSubmition] = useTransition();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  const submit = () => {
    startSubmition(async () => {
      const { data, error } = await createNewEvent(
        new Date(date.toDateString() + " " + time),
        isPublic,
      );
      if (error) {
        setErrorMessages(error.message.split("\n"));
        return;
      }
      setEvents((draft) => {
        draft.push({
          ...data[0],
          tickets: [],
          cancelled_tickets: [],
        });
        draft.sort((a, b) => {
          return (
            new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
          );
        });
      });
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        color="success"
        onClick={() => setIsOpen(true)}
        className="m-2 flex items-center gap-2 rounded-lg bg-cyan-700 px-2 py-1 text-sm text-white hover:bg-cyan-800"
      >
        <PlusIcon className="h-5 w-5" />
        Nový termín
      </button>
      <Modal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nový termín"
        dismissible
      >
        <Modal.Header>Nový termín</Modal.Header>
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
                onSelectedDateChanged={(date) => setDate(date)}
              />
              <div className="flex flex-1 flex-col">
                <input
                  type="time"
                  className="rounded-lg border border-gray-200 shadow-md"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
                <div className="mt-4 flex flex-1 flex-row justify-between">
                  <label htmlFor="is_public" className="ml-2">
                    Verejný
                  </label>
                  <Checkbox
                    // type="checkbox"
                    className="h-5 w-5 rounded-md border border-gray-200 bg-white shadow-md hover:cursor-pointer hover:shadow-none"
                    id="is_public"
                    name="is_public"
                    value={isPublic.toString()}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                </div>
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
              </div>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}
