import InlineLoading from "@/components/InlineLoading";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRxData } from "@/rxdb/db";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import moment from "moment";
import { useCallback, useMemo } from "react";

export default function EventRow({
  event,
  actionButton,
  onClick,
  className,
  onMouseEnter,
  onMouseLeave,
  additionalTickets,
}: {
  event: EventsDocument;
  actionButton?: JSX.Element;
  onClick?: () => void;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  additionalTickets?: TicketsDocument[];
}) {
  const { result: services } = useRxData(
    "services",
    useCallback(
      (collection) =>
        collection.find({
          selector: { id: { $eq: event.service_id } },
        }),
      [event.service_id],
    ),
  );

  const { result: rawTicketTypes } = useRxData(
    "ticket_types",
    useCallback(
      (collection) =>
        collection.find({
          selector: { service_id: { $eq: event.service_id } },
        }),
      [event.service_id],
    ),
  );

  const { result: tickets } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            event_id: { $eq: event.id },
            payment_status: { $ne: "zrušené" },
          },
        }),
      [event.id],
    ),
  );

  const ticketTypes = useMemo(
    () =>
      rawTicketTypes?.map((type) => ({
        ...type._data,
        sold:
          tickets
            ?.concat(additionalTickets || [])
            .filter((t) => t.type_id == type.id).length || 0,
      })),
    [additionalTickets, rawTicketTypes, tickets],
  );

  return (
    <button
      key={event.id}
      type="button"
      className={`flex w-full flex-wrap items-center justify-between gap-x-6 p-4 hover:bg-muted ${className}`}
      disabled={onClick ? false : true}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex min-w-0 flex-none flex-col gap-1 self-center py-0.5">
        <p className="flex items-center gap-4 font-semibold leading-6 text-gray-900">
          {services?.find((s) => s.id == event.service_id)?.name}
          <Badge
            size={"sm"}
            variant={event.is_public ? "default" : "outline"}
            className="rounded-md"
          >
            {event.is_public ? "Verejné" : "Súkromné"}
          </Badge>
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span
            className={`font-medium ${
              moment(event.datetime).isSame(moment(), "day")
                ? "!font-semibold tracking-wide text-orange-400"
                : ""
            }`}
          >
            {moment(event.datetime).isSame(moment(), "day")
              ? "Dnes"
              : new Date(event.datetime).toLocaleDateString("sk-SK")}
          </span>
          -<span>{new Date(event.datetime).toLocaleTimeString("sk-SK")}</span>
        </div>
      </div>
      <div className="ms-auto flex flex-col flex-wrap items-center justify-end gap-x-2 lg:flex-row">
        {ticketTypes ? (
          ticketTypes.map((type) => {
            return (
              <div key={type.label} className="w-28">
                <div
                  className={`flex items-end text-sm ${
                    type.is_vip ? "text-orange-400" : "text-gray-700"
                  }`}
                >
                  <span className="font-medium">{type.label}</span>
                  <span
                    className={`ms-auto text-base font-bold ${
                      type.capacity && type.sold > type.capacity
                        ? "text-destructive"
                        : type.sold == 0
                          ? "text-gray-400"
                          : ""
                    }`}
                  >
                    {type.sold}
                  </span>
                  {type.capacity && "/" + type.capacity}
                </div>
                {(type.capacity || type.capacity == 0) && (
                  <Progress
                    variant={
                      type.sold > type.capacity
                        ? "destructive"
                        : type.is_vip
                          ? "color"
                          : "default"
                    }
                    size="sm"
                    value={(type.sold / type.capacity) * 100}
                  />
                )}
              </div>
            );
          })
        ) : (
          <InlineLoading />
        )}
      </div>
      <div className="flex-shrink-0">{actionButton}</div>
    </button>
  );
}
