"use client";

import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { Badge } from "flowbite-react";
import Fuse from "fuse.js";
import { Fragment, useEffect, useMemo, useState } from "react";

export default function CustomComboBox<T extends {}>({
  options = [],
  defaultValue,
  displayFun,
  newValueBuilder,
  onSelect,
  searchKeys,
  label,
  placeholder,
  vertical = false,
  optional = false,
  iconEnd,
  iconStart,
  error,
  inline = false,
}: {
  options: T[];
  defaultValue?: T;
  displayFun: (obj: T) => string;
  newValueBuilder?: (value: string) => T;
  onSelect?: (value: T | null) => void;
  hideErrors?: boolean;
  searchKeys?: string[];
  label?: string;
  placeholder?: string;
  vertical?: boolean;
  optional?: boolean;
  iconEnd?: React.ReactNode;
  iconStart?: React.ReactNode;
  error?: React.ReactNode;
  inline?: boolean;
}) {
  const [value, setValue] = useState<T | null>(defaultValue || null);
  const [query, setQuery] = useState(
    defaultValue ? displayFun(defaultValue) : "",
  );

  useEffect(() => {
    setValue(defaultValue || null);
    setQuery(defaultValue ? displayFun(defaultValue) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const fuse = useMemo(
    () =>
      new Fuse<T>(options, {
        keys: searchKeys,
        shouldSort: true,
      }),
    [options, searchKeys],
  );

  const filteredOptions = useMemo(
    () =>
      query !== ""
        ? fuse.search(query).map((result) => result.item)
        : [...options].sort((a, b) => (displayFun(a) > displayFun(b) ? 1 : -1)),
    [displayFun, fuse, options, query],
  );

  return (
    <>
      <Combobox
        value={value}
        onChange={(v) => {
          setValue(v);
          setQuery(v ? displayFun(v) : "");
          onSelect && onSelect(v);
        }}
      >
        <div
          className={`relative w-full overflow-visible ${
            vertical ? "" : "flex flex-row items-center justify-between gap-8"
          }`}
        >
          {label && (
            <Combobox.Label className="p-1 text-sm text-gray-600">
              {label}
            </Combobox.Label>
          )}
          <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className={`w-full border-none bg-transparent text-gray-900 focus:ring-0 ${
                iconStart ? "ps-7" : " ps-3"
              } ${iconEnd ? "pe-8" : "pe-10"} ${inline ? "py-0.5" : "py-1"}`}
              onChange={(event) => setQuery(event.target.value)}
              displayValue={() => query}
              autoComplete="off"
              placeholder={placeholder}
              // onBlur={(e) => {
              //   setQuery(value ? displayFun(value) : "");
              // }}
            />
            <div className="absolute inset-y-0 left-1 grid items-center p-1">
              {iconStart}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center gap-1">
              {((value && displayFun(value).length == 0) ||
                (!value && query.length == 0)) &&
                (optional ? (
                  <Badge color={"gray"} className="pointer-events-none">
                    Volitelné
                  </Badge>
                ) : (
                  <Badge color={"red"} className="pointer-events-none">
                    Povinné
                  </Badge>
                ))}
              {iconEnd}
              <Combobox.Button className="group h-full p-1">
                <div className="grid h-full items-center rounded-md group-hover:bg-gray-100">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              </Combobox.Button>
            </div>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              {query.length > 0 &&
                newValueBuilder &&
                (!defaultValue || query != displayFun(defaultValue)) && (
                  <Combobox.Option
                    value={newValueBuilder(query)}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-teal-600 text-white" : "text-gray-900"
                      }`
                    }
                  >
                    {(defaultValue ? "Upraviť na " : "Vytvoriť nový kontakt ") +
                      `"${query}"`}
                  </Combobox.Option>
                )}
              {!query && optional && (
                <Combobox.Option
                  value={null}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-teal-600 text-white" : "text-gray-900"
                    }`
                  }
                >
                  Zrušiť výber
                </Combobox.Option>
              )}
              {filteredOptions.length === 0 ? (
                query === "" ? (
                  <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                    Začnite vyhľadávanie
                  </div>
                ) : (
                  <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                    Žiadne výsledky
                  </div>
                )
              ) : (
                filteredOptions.map((option, index) => (
                  <Combobox.Option
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-teal-600 text-white" : "text-gray-900"
                      }`
                    }
                    key={index}
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {displayFun(option)}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-teal-600"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
          {error}
        </div>
      </Combobox>
    </>
  );
}
