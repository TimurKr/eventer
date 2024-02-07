"use client";

import { Alert, Badge, Modal, Progress, Spinner } from "flowbite-react";
import { useContext, useState, useTransition } from "react";
import {
  EventWithTickets,
  bulkUpdateTicketFields,
} from "../../events/serverActions";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { Events, Tickets } from "@/utils/supabase/database.types";
import { useStore } from "zustand";
import { useStoreContext } from "../../zustand";
import { SubmitButton } from "@/app/components/FormElements";
import NewTicketModal from "../../events/modals/NewTicketModal";

export default function UseCouponSelectEvent({
  couponCode,
}: {
  couponCode: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { allEvents, ticketTypes } = useStoreContext((state) => state.events);

  return (
    <>
      <button
        className="rounded-md bg-green-500 px-1.5 py-0.5 text-xs text-white hover:bg-green-600 active:bg-green-700"
        onClick={() => setIsOpen(true)}
      >
        Use
      </button>
      <Modal show={isOpen} onClose={() => setIsOpen(false)} dismissible>
        <Modal.Header>
          Vyberte si udalosť, na ktorú by ste chceli predať lístky s týmto
          kupónom
        </Modal.Header>
        <Modal.Body>
          {allEvents.map((event) => (
            <div
              className={`my-0.5 flex w-full justify-between gap-x-6 rounded-md p-2 hover:bg-slate-100`}
            >
              <div className="flex min-w-0 flex-1 flex-col items-start self-center">
                <p className="flex items-center gap-4 font-semibold leading-6 text-gray-900">
                  {new Date(event.datetime).toLocaleDateString("sk-SK")}
                  <Badge
                    color={event.is_public ? "blue" : "purple"}
                    className="rounded-md"
                  >
                    {event.is_public ? "Verejné" : "Súkromné"}
                  </Badge>
                </p>
                <p className="truncate text-xs leading-5 text-gray-500">
                  {new Date(event.datetime).toLocaleTimeString("sk-SK")}
                </p>
              </div>
              <div className="flex flex-col items-center justify-start lg:flex-row lg:gap-4">
                {ticketTypes.map((type) => {
                  const sold = event.tickets.filter(
                    (t) => t.type == type.label,
                  ).length;
                  return (
                    <div key={type.label} className="w-28">
                      <div
                        className={`flex items-end text-sm ${
                          type.label == "VIP"
                            ? "text-amber-600"
                            : type.label == "standard"
                              ? "text-gray-600"
                              : ""
                        }`}
                      >
                        <span className="font-medium">{type.label}</span>
                        <span
                          className={`ms-auto text-base font-bold ${
                            sold > type.max_sold
                              ? "text-red-600"
                              : sold == 0
                                ? "text-gray-400"
                                : ""
                          }`}
                        >
                          {sold}
                        </span>
                        /<span>{type.max_sold}</span>
                      </div>
                      <Progress
                        className="mb-1"
                        size="sm"
                        progress={Math.min((sold / type.max_sold) * 100, 100)}
                        color={
                          sold > type.max_sold
                            ? "failure"
                            : type.label == "VIP"
                              ? "yellow"
                              : "gray"
                        }
                      />
                    </div>
                  );
                })}
              </div>
              <NewTicketModal
                eventId={event.id}
                couponCode={couponCode}
                onOpen={() => setIsOpen(false)}
              />
            </div>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
}
