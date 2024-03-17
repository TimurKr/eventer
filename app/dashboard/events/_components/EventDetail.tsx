"use client";

import { useRxData } from "@/rxdb/db";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import {
  LockClosedIcon,
  LockOpenIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Checkbox, Table } from "flowbite-react";
import { useCallback, useMemo, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";
import ConvertToCouponModal from "../_modals/ConvertToCouponModal";
import MoveTicketsToDifferentEventModal from "../_modals/MoveTicketsToDifferentEventModal";
import EditEventButton from "../edit-event/button";
import NewTicketsButton from "../new-tickets/button";
import { TicketsSorting } from "../utils";
import EventRow from "./EventRow";
import TicketGroup from "./TicketGroup";

const ticketStatuses = ["rezervované", "zaplatené", "zrušené"];

export default function EventDetail({
  event,
  allHighlightedTickets,
}: {
  event: EventsDocument;
  allHighlightedTickets?: TicketsDocument[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<TicketsDocument[]>([]);
  const [lockedArrived, setLockedArrived] = useState(true);
  const [showCancelledTickets, setShowCancelledTickets] = useState(false);

  const toggleSelectedTicket = (
    tickets: TicketsDocument | TicketsDocument[],
  ) => {
    let newSelectedTickets = selectedTickets;
    if (!Array.isArray(tickets)) {
      tickets = [tickets];
    }
    tickets.forEach((ticket) => {
      if (newSelectedTickets.find((st) => st === ticket)) {
        newSelectedTickets = newSelectedTickets.filter(
          (t) => t.id !== ticket.id,
        );
      } else {
        newSelectedTickets = [...newSelectedTickets, ticket];
      }
    });
    setSelectedTickets(newSelectedTickets);
  };

  const { result: allServices } = useRxData(
    "services",
    useCallback((collection) => collection.find(), []),
  );

  const { result: allTickets, collection: ticketsCollection } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: { event_id: { $eq: event.id } },
          sort: TicketsSorting,
        }),
      [event.id],
    ),
  );

  const { tickets, cancelled_tickets } = useMemo(() => {
    const tickets =
      allTickets?.filter((t) => t.payment_status != "zrušené") || [];
    const cancelled_tickets =
      allTickets?.filter((t) => t.payment_status == "zrušené") || [];
    return { tickets, cancelled_tickets };
  }, [allTickets]);

  const { result: allContacts } = useRxData(
    "contacts",
    useCallback(
      (collection) =>
        collection
          .find()
          .where("id")
          .in(tickets.map((t) => t.billing_id)),
      [tickets],
    ),
  );

  const { highlightedTickets, highlightedCancelledTickets } = useMemo(() => {
    return {
      highlightedTickets: allHighlightedTickets?.filter(
        (t) => t.payment_status != "zrušené",
      ),
      highlightedCancelledTickets: allHighlightedTickets?.filter(
        (t) => t.payment_status == "zrušené",
      ),
    };
  }, [allHighlightedTickets]);

  const isShown =
    isExpanded ||
    highlightedTickets?.length ||
    highlightedCancelledTickets?.length;

  return (
    <li
      key={event.id}
      className={`flex flex-col rounded-lg transition-all first:mt-0 last:mb-0 ${
        isShown ? "my-6 bg-stone-200 shadow-lg" : "my-2"
      }`}
    >
      <EventRow
        className={`transition-all duration-300 ${isShown ? "!bg-stone-300 !p-4 hover:!bg-stone-200 shadow-lg" : ""}`}
        event={event}
        onClick={() => setIsExpanded(!isExpanded)}
        actionButton={<NewTicketsButton eventId={event.id.toString()} />}
      />
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isShown
            ? "p-4 grid-rows-[1fr] rounded-b-xl opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="flex items-end justify-end gap-2 overflow-y-hidden">
          <EditEventButton eventId={event.id.toString()} />
          <button
            type="button"
            onClick={() =>
              event.incrementalPatch({ is_public: !event.is_public })
            }
            className="me-auto flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-2 py-1 text-sm text-stone-700 hover:bg-stone-100"
          >
            {event.is_public ? (
              <>
                <LockClosedIcon className="h-3 w-3"></LockClosedIcon>
                <span>Spraviť udalosť súkromnou</span>
              </>
            ) : (
              <>
                <LockOpenIcon className="h-3 w-3"></LockOpenIcon>
                <span>Zverejniť udalosť</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-red-500 px-2 py-1 text-sm text-red-500 hover:bg-red-50"
            onClick={() => {
              if (tickets?.length) {
                alert(
                  "Nemôžete vymazať udalosť, ktorá má predané lístky. Najprv vymažte lístky.",
                );
                return;
              }
              if (!confirm("Naozaj chcete vymazať túto udalosť?")) return;
              event.remove();
            }}
          >
            Vymazať udalosť
            <TrashIcon className="h-4 w-4"></TrashIcon>
          </button>
        </div>
      </div>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isShown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-y-hidden px-2">
          <hr className="border-dashed" />
          <div className="flex items-center gap-2 py-2">
            <p className="ps-2 text-md font-medium tracking-wider text-gray-700">
              Lístky
            </p>
            {/* <div className="mx-4 h-px flex-grow bg-stone-400" /> */}
            <div className="flex flex-col text-xs text-gray-500">
              {highlightedTickets && highlightedCancelledTickets && (
                <span>
                  <span className="font-semibold">
                    {highlightedTickets.length +
                      highlightedCancelledTickets.length}{" "}
                  </span>
                  nájdených lítkov
                </span>
              )}
              {highlightedCancelledTickets && (
                <span>
                  z toho{" "}
                  <span className="font-semibold">
                    {highlightedCancelledTickets.length}{" "}
                  </span>
                  zrušených
                </span>
              )}
            </div>
            <p className="ms-auto text-sm text-gray-600">
              (Označených: {selectedTickets.length})
            </p>
            <MoveTicketsToDifferentEventModal
              originalEvent={event}
              selectedTickets={selectedTickets}
            />
            <ConvertToCouponModal selectedTickets={selectedTickets} />
            <button
              className="rounded-md bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 active:bg-red-800"
              onClick={() => {
                if (selectedTickets.length === 0) {
                  alert("Zvolte aspoň jeden lístok");
                  return;
                }
                if (
                  !confirm(
                    `POZOR! Táto akcia je nevratná, stratíte všetky údaje. Naozaj chcete vymazať označené lístky (${selectedTickets.length})? Zvážte iba zmenu statusu na zrušené.`,
                  )
                )
                  return;
                ticketsCollection?.bulkRemove(selectedTickets.map((t) => t.id));
              }}
            >
              Vymazať
            </button>
          </div>
          {tickets?.length ? (
            <div className="w-full overflow-x-auto py-2">
              <Table className="w-full">
                <Table.Head className="!bg-white">
                  <Table.HeadCell className="p-1 px-2">
                    <Checkbox
                      className="me-2"
                      checked={tickets.every((t) =>
                        selectedTickets.find((st) => st.id === t.id),
                      )}
                      onChange={() => {
                        const checked = tickets.every((t) =>
                          selectedTickets.find((st) => st.id === t.id),
                        );
                        const ticketsToToggle = tickets.filter((t) =>
                          checked
                            ? true
                            : !selectedTickets.find((st) => st.id === t.id),
                        );
                        toggleSelectedTicket(ticketsToToggle);
                      }}
                    />
                    #
                  </Table.HeadCell>
                  <Table.HeadCell className="px-auto p-1">Typ</Table.HeadCell>
                  <Table.HeadCell className="p-1 text-center" colSpan={1}>
                    Hostia
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-center">
                    Platca
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 px-0">
                    <div className="item-center-justify-center flex gap-1">
                      <button
                        className="text-gray-500 hover:text-gray-600 active:text-gray-700"
                        onClick={() => setLockedArrived(!lockedArrived)}
                      >
                        {lockedArrived ? (
                          <LockClosedIcon className="h-3 w-3" />
                        ) : (
                          <LockOpenIcon className="h-3 w-3" />
                        )}
                      </button>
                      Dorazil
                    </div>
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-center">
                    Status
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-center">
                    Poznámka
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-end">
                    Poukaz
                  </Table.HeadCell>
                  <Table.HeadCell className="p-1 text-end">Cena</Table.HeadCell>
                  <Table.HeadCell className="p-1">
                    <span className="sr-only">Edit</span>
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {tickets.length > 0 && (
                    <TicketGroup
                      event={event}
                      cancelled={false}
                      highlightedTickets={highlightedTickets}
                      selectedTickets={selectedTickets}
                      toggleSelectedTicket={toggleSelectedTicket}
                      lockedArrived={lockedArrived}
                    />
                  )}
                  {cancelled_tickets.length > 0 && (
                    <>
                      <Table.Row className="text-center">
                        <Table.Cell className="p-1" colSpan={9}>
                          <button
                            className="flex w-full items-center justify-center hover:underline"
                            onClick={() =>
                              setShowCancelledTickets(!showCancelledTickets)
                            }
                          >
                            <HiChevronDown
                              className={`${
                                showCancelledTickets
                                  ? "rotate-180 transform"
                                  : ""
                              } h-4 w-4 transition-transform duration-500 group-hover:text-gray-600`}
                            />
                            Zrušené lístky
                          </button>
                        </Table.Cell>
                      </Table.Row>
                      {(showCancelledTickets ||
                        highlightedCancelledTickets) && (
                        <TicketGroup
                          event={event}
                          cancelled={true}
                          highlightedTickets={highlightedCancelledTickets}
                          selectedTickets={selectedTickets}
                          toggleSelectedTicket={toggleSelectedTicket}
                          lockedArrived={lockedArrived}
                        />
                      )}
                    </>
                  )}
                </Table.Body>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-2">
              <p className="text-center text-xs text-gray-500">Žiadne lístky</p>
              <NewTicketsButton eventId={event.id.toString()} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
