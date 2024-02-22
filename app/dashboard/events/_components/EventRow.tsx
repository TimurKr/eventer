import { Badge, Progress } from "flowbite-react";
import moment from "moment";
import { Services } from "../../services/serverActions";
import { Events } from "../store/helpers";

export default function EventRows({
  events,
  services,
  actionButton,
  onClick,
  className,
  onMouseEnter,
  onMouseLeave,
}: {
  events: Events[];
  services: Services[];
  actionButton?: (id: Events) => JSX.Element;
  onClick?: (event: Events) => void;
  className?: string;
  onMouseEnter?: (event: Events) => void;
  onMouseLeave?: (event: Events) => void;
}) {
  return events.map((event) => (
    <button
      key={event.id}
      type="button"
      className={`flex w-full items-center justify-between gap-x-6 rounded-lg p-2 hover:bg-slate-100 ${className}`}
      disabled={onClick ? false : true}
      onClick={() => onClick?.(event)}
      onMouseEnter={() => onMouseEnter?.(event)}
      onMouseLeave={() => onMouseLeave?.(event)}
    >
      <div className="flex min-w-0 flex-none flex-col gap-1 self-center py-0.5">
        <p className="flex items-center gap-4 font-semibold leading-6 text-gray-900">
          {services.find((s) => s.id == event.service_id)?.name}
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
      <div className="ms-auto flex flex-col flex-wrap items-center justify-end gap-x-2 lg:flex-row">
        {services
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
                  {type.capacity && "/" + type.capacity}
                </div>
                <Progress
                  className="mb-1"
                  size="sm"
                  progress={type.capacity ? (sold / type.capacity) * 100 : 0}
                  color={
                    type.capacity && sold > type.capacity
                      ? "red"
                      : type.is_vip
                        ? "yellow"
                        : "gray"
                  }
                  theme={{
                    bar: "transition-all rounded-full",
                  }}
                />
              </div>
            );
          })}
      </div>
      <div className="flex-shrink-0">{actionButton?.(event)}</div>
    </button>
  ));
}
