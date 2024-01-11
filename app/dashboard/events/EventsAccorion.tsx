"use client";

import { Events, Tickets } from "@/utils/supabase/database.types";
import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { types } from "util";

export default function EventsAccordion({
  events,
}: {
  events: (Events & { tickets: Tickets[] })[];
}) {
  const getIsPublicBadge = (isPublic: boolean) =>
    isPublic ? (
      <span className="ml-2 inline-flex items-center self-start rounded-md bg-blue-100 px-1 text-xs font-medium text-blue-600">
        Verejné
      </span>
    ) : (
      <span className="ml-2 inline-flex items-center self-start rounded-md bg-purple-100 px-1 text-xs font-medium text-purple-600">
        Súkromné
      </span>
    );

  // Create a state for the accordion
  const [expanded, setExpanded] = useState<String[]>([]);

  return (
    <ul
      role="list"
      className="w-auto divide-y divide-gray-200 rounded-md border border-gray-300 px-2"
    >
      {events.map((event) => {
        // Get all unique ticket types
        const ticketTypes = [
          { label: "VIP", color: "yellow", max_sold: 6 },
          { label: "standard", color: "gray", max_sold: 24 },
        ];

        return (
          <li key={event.id} className="flex justify-between gap-x-6 p-2">
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-sm font-semibold leading-6 text-gray-900">
                {new Date(event.datetime).toLocaleDateString("sk-SK")}
              </p>
              <p className="truncate text-xs leading-5 text-gray-500">
                {new Date(event.datetime).toLocaleTimeString("sk-SK")}
                {getIsPublicBadge(event.is_public)}
              </p>
            </div>
            <div className="flex w-24 flex-col justify-start gap-1">
              {ticketTypes.map((type) => (
                <div key={type.label}>
                  <div className="flex justify-between">
                    <span
                      className={`text-sm font-medium text-${type.color}-600`}
                    >
                      {type.label}
                    </span>
                    <span
                      className={`text-sm font-medium text-${type.color}-600`}
                    >
                      {event.tickets.filter((t) => t.type == type.label).length}
                    </span>
                  </div>
                  <div className={`dark h-1 w-full rounded-full bg-gray-300`}>
                    <div
                      className={`h-full rounded-full bg-${type.color}-600`}
                      style={{
                        width:
                          (
                            (event.tickets.filter((t) => t.type == type.label)
                              .length /
                              type.max_sold) *
                            100
                          ).toString() + "%",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-between gap-1">
              <button
                className="border-1 rounded-md border border-green-300 bg-green-200 px-2 text-sm text-green-700 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                disabled={
                  event.tickets.length ==
                  ticketTypes.map((t) => t.max_sold).reduce((a, b) => a + b, 0)
                }
              >
                Predať lístok
              </button>
              <button
                className="border-1 group flex items-center justify-center rounded-md bg-gray-200 px-2 text-sm text-gray-700"
                onClick={() =>
                  setExpanded(
                    expanded.includes(event.id.toString())
                      ? expanded.filter((e) => e != event.id.toString())
                      : [...expanded, event.id.toString()],
                  )
                }
              >
                <ChevronDownIcon
                  className={`${
                    expanded.includes(event.id.toString())
                      ? "rotate-180 transform"
                      : ""
                  } h-5 w-5 text-gray-500 transition-transform duration-500 group-hover:text-gray-600`}
                />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
