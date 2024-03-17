"use client";

import InlineLoading from "@/components/InlineLoading";
import { useRxData } from "@/rxdb/db";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import { Table } from "flowbite-react";
import React, { useCallback, useMemo } from "react";
import TicketRow from "./TicketRow";

export default function TicketGroup({
  event,
  cancelled,
  highlightedTickets,
  selectedTickets,
  toggleSelectedTicket,
  lockedArrived,
}: {
  event: EventsDocument;
  cancelled: boolean;
  highlightedTickets?: TicketsDocument[];
  selectedTickets: TicketsDocument[];
  toggleSelectedTicket: (ticket: TicketsDocument) => void;
  lockedArrived: boolean;
}) {
  const { result: allTickets } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            event_id: { $eq: event.id },
            payment_status: cancelled ? { $eq: "zrušené" } : { $ne: "zrušené" },
          },
        }),
      [cancelled, event.id],
    ),
  );

  const groupedTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets
      .map((t) => t.billing_id)
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((billing_id) => ({
        billing_id,
        tickets: allTickets.filter((t) => t.billing_id === billing_id),
      }));
  }, [allTickets]);

  return (
    <React.Fragment key={event.id + (cancelled ? "-cancelled" : "")}>
      {allTickets ? (
        groupedTickets.map((group) => (
          <React.Fragment key={"spacing-" + group.billing_id}>
            <Table.Row
              key={"spacing-" + group.billing_id}
              className="h-1"
            ></Table.Row>
            {group.tickets.map((ticket) => (
              <TicketRow
                key={"ticket-" + ticket.id}
                ticket={ticket}
                eventTickets={allTickets}
                selectedTickets={selectedTickets}
                toggleSelectedTicket={toggleSelectedTicket}
                lockedArrived={lockedArrived}
                highlightedTickets={highlightedTickets}
              />
            ))}
          </React.Fragment>
        ))
      ) : (
        <Table.Row className="h-1">
          <Table.Cell className="p-1" colSpan={10}>
            <InlineLoading />
          </Table.Cell>
        </Table.Row>
      )}
      {!cancelled && (
        <Table.Row className="h-1">
          <Table.Cell className="p-1" colSpan={8} />
          <Table.Cell className="p-1 text-end font-bold tracking-wider text-black">
            <hr />
            {allTickets ? (
              allTickets.reduce((acc, t) => acc + t.price, 0)
            ) : (
              <InlineLoading />
            )}{" "}
            €
          </Table.Cell>
          <Table.Cell className="p-1" colSpan={1} />
        </Table.Row>
      )}
    </React.Fragment>
  );
}
