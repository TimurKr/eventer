"use client";

import { XCircleIcon } from "@heroicons/react/24/outline";
import { Datepicker } from "flowbite-react";
import moment from "moment";

export default function CustomDatePicker({
  value,
  onChange,
  label,
  vertical = false,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  vertical?: boolean;
}) {
  return (
    <div
      className={`w-full ${
        vertical ? "" : "flex flex-row items-center justify-between gap-8"
      }`}
    >
      {label && <label className="p-1 text-sm text-gray-600">{label}</label>}
      <div className="flex w-full items-center justify-end">
        {value ? (
          <div className="w-full py-0.5">
            <Datepicker
              language="sk-SK"
              autoHide
              showClearButton={false}
              showTodayButton={false}
              defaultDate={new Date(value)}
              weekStart={1}
              onSelectedDateChanged={onChange}
              theme={{
                root: {
                  input: {
                    field: {
                      input: {
                        base: "!py-1 text-sm text-end !px-2 font-mono w-full border-gray-200 bg-gray-50",
                      },
                      icon: { base: "hidden" },
                    },
                  },
                },
              }}
            />
            <p className="px-2 text-end text-xs text-gray-500">
              {moment(value).endOf("day").fromNow()}
            </p>
          </div>
        ) : (
          <p className="px-2 text-gray-500">-</p>
        )}
        <button
          type="button"
          className={`p-2 text-gray-600 transition-all duration-100 hover:scale-105 ${
            value
              ? "hover:text-red-500 active:text-red-700"
              : "hover:text-green-500 active:text-green-700"
          }`}
          onClick={() =>
            value ? onChange(null) : onChange(moment().add(1, "month").toDate())
          }
        >
          <XCircleIcon
            className={`w-4 transition-transform ${
              value ? "rotate-0" : "rotate-45"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
