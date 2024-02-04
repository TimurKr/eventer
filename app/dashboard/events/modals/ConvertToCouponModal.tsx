"use client";

import { Alert, Badge, Modal, Progress, Spinner } from "flowbite-react";
import { useContext, useState, useTransition } from "react";
import {
  bulkUpdateTicketFields,
  convertTicketsToCoupon,
} from "../serverActions";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { Events, Tickets } from "@/utils/supabase/database.types";
import { useStore } from "zustand";
import { EventsContext } from "../zustand";
import { SubmitButton } from "@/app/components/FormElements";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export default function ConvertToCouponModal({
  eventId,
  disabled,
}: {
  eventId: Events["id"];
  disabled?: boolean;
}) {
  const [isSubmitting, startSubmition] = useTransition();
  const [hoveringEvent, setHoveringEvent] = useState<Events | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  const store = useContext(EventsContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const { allEvents, ticketTypes, refresh } = useStore(store, (state) => state);
  const selectedTickets = useStore(store, (state) =>
    state.allEvents
      .find((e) => e.id === eventId)!
      .tickets.filter((t) => state.selectedTicketIds.includes(t.id)),
  );

  return (
    <>
      <button
        className="rounded-md bg-cyan-600 px-2 py-0.5 text-xs text-white hover:bg-cyan-700 active:bg-cyan-800 disabled:!bg-gray-400"
        onClick={() =>
          selectedTickets.length == 0
            ? alert("Zvolte aspoň jeden lístok")
            : setIsOpen(true)
        }
        disabled={disabled}
      >
        Premeniť na kupón
      </button>
      <Modal show={isOpen} onClose={() => setIsOpen(false)} dismissible>
        <Modal.Header>
          Naozaj chcete premeniť zvolené lístky na kupón?
        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-wrap items-center gap-2">
            <p className="p-2">Zvolené lístky:</p>
            {ticketTypes.map((type) => (
              <div className="rounded-lg border border-gray-300 bg-slate-50 px-2 py-1">
                <span className="font-semibold">{type.label}</span>:{" "}
                <span className="font-bold">
                  {selectedTickets.filter((t) => t.type == type.label).length}
                </span>{" "}
                lístkov
              </div>
            ))}
            {isSubmitting && <Spinner />}
          </div>
          <hr className="my-2" />
          <p className="flex items-center text-gray-700">
            <InformationCircleIcon className="me-2 h-4 w-4" />
            Zvolené lístky budú zrušené a vytvorí sa jeden kupón v hodnote{" "}
            {selectedTickets.map((t) => t.price).reduce((a, b) => a + b, 0)}€
          </p>
          <form
            action={() => {
              startSubmition(async () => {
                const r = await convertTicketsToCoupon(selectedTickets);
                if (r.error) {
                  setErrorMessages(r.error.message.split("\n"));
                  return;
                }
                refresh();
                setIsOpen(false);
              });
            }}
          >
            <SubmitButton
              isSubmitting={isSubmitting}
              label="Potvrdiť"
              submittingLabel="Vytváram kupón..."
              className="ms-auto"
            />
          </form>
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
