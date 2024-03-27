"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRxData } from "@/rxdb/db";
import { TicketTypesDocument } from "@/rxdb/schemas/public/ticket_types";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import {
  ExclamationTriangleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { cva } from "class-variance-authority";
import { useCallback, useMemo } from "react";

export function AddTicketButton({
  type,
  alreadyCreatedTickets,
  eventId,
  onClick,
}: {
  type: TicketTypesDocument;
  alreadyCreatedTickets: Pick<TicketsDocument, "type_id">[];
  eventId: string;
  onClick: () => void;
}) {
  const creating = useMemo(
    () => alreadyCreatedTickets.filter((t) => t.type_id == type.id).length,
    [alreadyCreatedTickets, type.id],
  );

  const { result: soldTickets } = useRxData(
    "tickets",
    useCallback(
      (c) =>
        c.find({
          selector: {
            type_id: type.id,
            payment_status: { $ne: "zrušené" },
            event_id: eventId,
          },
        }),
      [eventId, type.id],
    ),
  );

  const buttonClasses = cva(
    "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ",
    {
      variants: {
        variant: {
          default:
            "bg-background hover:bg-accent border border-input shadow-sm hover:text-accent-foreground",
          tooMany:
            "border-red-100 bg-red-100 text-red-600 hover:cursor-default",
          sold: "border-gray-100 bg-gray-50 text-gray-400 hover:cursor-default",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    },
  );

  return (
    <button
      key={type.id}
      type="button"
      className={buttonClasses({
        variant:
          type.capacity && creating > type.capacity - (soldTickets?.length || 0)
            ? "tooMany"
            : type.capacity &&
                creating == type.capacity - (soldTickets?.length || 0)
              ? "sold"
              : "default",
      })}
      // className={`flex items-center gap-2 rounded-lg border p-0 px-2 py-1 text-sm ${
      //   type.capacity && creating > type.capacity - (soldTickets?.length || 0)
      //     ? "border-red-100 bg-red-100 text-red-600 hover:cursor-default"
      //     : type.capacity &&
      //         creating == type.capacity - (soldTickets?.length || 0)
      //       ? "border-gray-100 bg-gray-50 text-gray-400 hover:cursor-default"
      //       : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
      // }`}
      onClick={onClick}
    >
      {type.is_vip && <CheckBadgeIcon className="h-5 w-5 text-green-500" />}
      <div className="flex flex-col items-start">
        <p className="font-medium">{type.label}</p>
        <div className="text-xs font-light">
          <span className="font-medium">{creating}</span>
          {type.capacity &&
            `/${type.capacity - (soldTickets?.length || 0)} voľných`}
        </div>
      </div>
      <PlusCircleIcon className="h-5 w-5" />
    </button>
  );
}

export function TooManySoldAlert({
  type,
  creatingTickets,
  eventId,
}: {
  type: TicketTypesDocument;
  creatingTickets: Pick<TicketsDocument, "type_id">[];
  eventId: string;
}) {
  const { result: soldTickets } = useRxData(
    "tickets",
    useCallback(
      (c) =>
        c.find({
          selector: {
            type_id: type.id,
            payment_status: { $ne: "zrušené" },
            event_id: eventId,
          },
        }),
      [eventId, type.id],
    ),
    { initialResult: [] },
  );

  const afterSaleCount = useMemo(
    () =>
      (soldTickets.length || 0) +
      creatingTickets.filter((t) => t.type_id == type.id).length,
    [creatingTickets, soldTickets, type.id],
  );

  if (type.capacity && afterSaleCount > type.capacity) {
    return (
      <Alert variant={"destructive"} className="my-4">
        <ExclamationTriangleIcon className="h-5 w-5" />
        <AlertTitle>Prekročený limit lístkov typu {type.label}</AlertTitle>
        <AlertDescription>
          Po vytvorení bude {afterSaleCount} lístkov typu{" "}
          <span className="font-semibold">{type.label}</span>, čo je viac ako
          povolených {type.capacity}.
        </AlertDescription>
      </Alert>
    );
  }
}
