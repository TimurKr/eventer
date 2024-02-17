"use client";

import { Badge, Modal, Progress } from "flowbite-react";
import { useState } from "react";
import { useStoreContext } from "../../store";
import moment from "moment";
import NewTicketsButton from "../../events/new-tickets/button";

export default function UseCouponSelectEvent({
  couponCode,
}: {
  couponCode: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const {
    events: { allEvents },
    services: { allServices },
  } = useStoreContext((state) => state);

  return (
    <>
      <button
        className="rounded-md bg-green-500 px-1.5 py-0.5 text-xs text-white hover:bg-green-600 active:bg-green-700"
        onClick={() => setIsOpen(true)}
      >
        Use
      </button>
      <Modal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        dismissible
        size={"4xl"}
      >
        <Modal.Header>
          Vyberte si udalosť, na ktorú by ste chceli predať lístky s týmto
          kupónom
        </Modal.Header>
        <Modal.Body>
          {allEvents.map((event) => (
            <div
              className={`my-0.5 flex w-full items-center justify-between gap-x-6 rounded-md p-2 hover:bg-slate-100`}
            >
              <div className="flex min-w-0 flex-col gap-1 self-center py-0.5">
                <p className="flex items-center gap-4 font-semibold leading-6 text-gray-900">
                  {allServices.find((s) => s.id == event.service_id)?.name}
                  <Badge
                    color={event.is_public ? "blue" : "purple"}
                    className="rounded-md"
                  >
                    {event.is_public ? "Verejné" : "Súkromné"}
                  </Badge>
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      moment(event.datetime).isSame(moment(), "day")
                        ? "text-cyan-700"
                        : ""
                    }`}
                  >
                    {moment(event.datetime).isSame(moment(), "day")
                      ? "Dnes"
                      : new Date(event.datetime).toLocaleDateString("sk-SK")}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.datetime).toLocaleTimeString("sk-SK")}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-start lg:flex-row lg:gap-4">
                {allServices
                  .find((s) => s.id === event.service_id)!
                  .ticket_types.map((type) => {
                    const sold = event.tickets.filter(
                      (t) => t.type_id == type.id,
                    ).length;
                    return (
                      <div key={type.label} className="w-28">
                        <div
                          className={`flex items-end text-sm ${
                            type.is_vip ? "text-amber-600" : "text-gray-600"
                          }`}
                        >
                          <span className="font-medium">{type.label}</span>
                          <span
                            className={`ms-auto text-base font-bold ${
                              type.capacity && sold > type.capacity
                                ? "text-red-600"
                                : sold == 0
                                  ? "text-gray-400"
                                  : ""
                            }`}
                          >
                            {sold}
                          </span>
                          /<span>{type.capacity || "-"}</span>
                        </div>
                        <Progress
                          className="mb-1"
                          size="sm"
                          progress={
                            type.capacity ? (sold / type.capacity) * 100 : 0
                          }
                          color={
                            type.capacity && sold > type.capacity
                              ? "red"
                              : type.is_vip
                                ? "yellow"
                                : "gray"
                          }
                        />
                      </div>
                    );
                  })}
              </div>
              <NewTicketsButton
                eventId={event.id.toString()}
                couponCode={couponCode}
              />
            </div>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
}
