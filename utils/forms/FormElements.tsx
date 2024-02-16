"use client";

import { Combobox, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Badge, Button, ToggleSwitch } from "flowbite-react";
import {
  ErrorMessage,
  Field,
  FieldMetaProps,
  FieldProps,
  GenericFieldHTMLAttributes,
  useField,
} from "formik";
import Fuse from "fuse.js";
import { Fragment, HTMLInputTypeAttribute, useEffect, useState } from "react";
import { toast } from "react-toastify";

export function CustomErrorMessage({
  fieldMeta,
}: {
  fieldMeta: FieldMetaProps<any>;
}) {
  if (
    !fieldMeta.error ||
    // !fieldMeta.touched ||
    typeof fieldMeta.error != "string"
  )
    return null;
  return (
    <p className="my-1 flex items-center text-clip text-sm leading-4 text-red-500">
      <>
        <ExclamationCircleIcon className="mr-1 inline-block h-4 w-4" />
        {fieldMeta.error}
      </>
    </p>
  );
}

type FormikTextFieldProps = {
  name: string;
  optional?: boolean;
  vertical?: boolean;
  type?: "text" | "password" | "email" | "texarea" | "number";
  placeHolder?: string;
  label?: string;
  hideErrors?: boolean;
  className?: string;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
};

export const FormikTextField = ({
  name,
  optional = false,
  vertical = false,
  type = "text",
  placeHolder,
  label,
  hideErrors,
  className,
  iconStart,
  iconEnd,
}: FormikTextFieldProps) => (
  <>
    <Field name={name}>
      {(props: FieldProps) => {
        return (
          <div
            className={`w-full ${
              vertical ? "" : "flex flex-row items-center justify-between gap-8"
            }`}
          >
            {label && (
              <label className="p-1 text-gray-700" htmlFor={props.field.name}>
                {label}
              </label>
            )}
            <div className="basis-3/4">
              <div
                className={`relative w-full items-center rounded-lg border border-gray-200 bg-gray-50 text-sm ${
                  !hideErrors && props.meta.error ? "!border-red-500" : ""
                } ${className}`}
              >
                <div className="absolute inset-y-0 left-1 grid items-center p-1">
                  {iconStart}
                </div>
                <div className="absolute inset-y-0 right-1 flex items-center gap-1 p-1">
                  {iconEnd}
                  {(!props.field.value || props.field.value.length < 5) &&
                    (optional ? (
                      <Badge color={"gray"} className="pointer-events-none">
                        Volitelné
                      </Badge>
                    ) : (
                      <Badge color={"red"} className="pointer-events-none">
                        Povinné
                      </Badge>
                    ))}
                </div>
                <input
                  className={`z-10 m-0 w-full flex-row rounded-lg border-none bg-transparent py-1 placeholder:text-gray-400 ${
                    iconStart ? "pl-7" : ""
                  } ${type === "number" && iconEnd ? "pe-8" : "pe-1"}`}
                  type={type}
                  {...props.field}
                  placeholder={placeHolder}
                />
              </div>
              {hideErrors || <CustomErrorMessage fieldMeta={props.meta} />}
            </div>
          </div>
        );
      }}
    </Field>
  </>
);

export const FormikSelectField = ({
  children,
  name,
  className,
  vertical = false,
  label,
}: {
  children: React.ReactNode;
  name: string;
  className?: string;
  vertical?: boolean;
  label?: string;
}) => {
  const [field, meta, helpers] = useField(name);
  return (
    <div
      className={`w-full ${
        vertical ? "" : "flex flex-row items-center justify-between gap-8"
      }`}
    >
      {label && (
        <label className="p-1 text-gray-700" htmlFor={field.name}>
          {label}
        </label>
      )}
      <select
        {...field}
        className={`ms-auto w-full rounded-lg border-gray-200 bg-gray-50 py-1 ${
          className || ""
        }`}
      >
        {children}
      </select>
      <CustomErrorMessage fieldMeta={meta} />
    </div>
  );
};

export function CustomComboBox<T extends {}>({
  options,
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
}: {
  options: T[];
  defaultValue?: T;
  displayFun: (obj: T) => string;
  newValueBuilder?: (value: string) => T;
  onSelect?: (value: T) => void;
  hideErrors?: boolean;
  searchKeys?: string[];
  label?: string;
  placeholder?: string;
  vertical?: boolean;
  optional?: boolean;
  iconEnd?: React.ReactNode;
  iconStart?: React.ReactNode;
  error?: React.ReactNode;
}) {
  const [value, setValue] = useState<T | null>(defaultValue || null);
  const [query, setQuery] = useState("");
  const fuse = new Fuse<T>(options, {
    keys: searchKeys,
    shouldSort: true,
  });

  const filteredOptions =
    query !== ""
      ? fuse.search(query).map((result) => result.item)
      : [...options].sort((a, b) => (displayFun(a) > displayFun(b) ? 1 : -1));

  return (
    <>
      <Combobox
        value={value}
        onChange={(v) => {
          setValue(v);
          setQuery(v ? displayFun(v) : "");
          v && onSelect && onSelect(v);
        }}
      >
        <div
          className={`relative w-full overflow-visible ${
            vertical ? "" : "flex flex-row items-center justify-between gap-8"
          }`}
        >
          {label && (
            <Combobox.Label className="p-1 text-gray-700">
              {label}
            </Combobox.Label>
          )}
          <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className={`w-full border-none py-1 text-gray-900 focus:ring-0 ${
                iconStart ? "ps-7" : " ps-3"
              } ${iconEnd ? "pe-8" : "pe-10"}`}
              onChange={(event) => setQuery(event.target.value)}
              displayValue={displayFun}
              autoComplete="off"
              placeholder={placeholder}
            />
            <div className="absolute inset-y-0 left-1 grid items-center p-1">
              {iconStart}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center gap-1">
              {query.length < 5 &&
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
              {query.length > 0 && newValueBuilder && (
                <Combobox.Option
                  value={newValueBuilder(query)}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-teal-600 text-white" : "text-gray-900"
                    }`
                  }
                >
                  Vytvoriť "{query}"
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

type InstantFieldProps<T> = {
  defaultValue: T;
  placeholder?: string;
  className?: string;
  validate?: (value: T) => Promise<string | null>;
  updateDatabase: (value: T) => void | Promise<any>;
  setLocalValue?: (value: T) => void | Promise<void>;
  onBlur?: () => void;
  autoFocus?: boolean;
};

export function InstantSwitchField({
  defaultValue,
  className,
  disabled = false,
  validate,
  updateDatabase,
  setLocalValue,
  onBlur,
}: Omit<InstantFieldProps<boolean>, "placeholder"> & { disabled: boolean }) {
  const [value, setValue] = useState<boolean>(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <ToggleSwitch
      className={`${className}`}
      sizing={"sm"}
      disabled={disabled}
      checked={value}
      onChange={async (newValue) => {
        setValue(newValue);
        const err = validate && (await validate(newValue));
        if (err) setError(err);
        else setError(null);
        const toastId = toast.loading("Ukladám...", { autoClose: false });
        const r = await updateDatabase(newValue);
        if (r?.terminate) {
          toast.dismiss(toastId);
          onBlur && onBlur();
          setValue(defaultValue);
          return;
        }
        if (r?.error) {
          toast.update(toastId, {
            render: "Nastala chyba: " + r.error.message,
            type: "error",
            closeButton: true,
            isLoading: false,
          });
          setValue(defaultValue);
          return;
        }
        setLocalValue && (await setLocalValue(newValue));
        toast.update(toastId, {
          render: "Uložené",
          type: "success",
          isLoading: false,
          autoClose: 1500,
        });
        onBlur && onBlur();
      }}
    />
  );
}

export function InstantCheckboxField({
  defaultValue,
  className,
  disabled = false,
  validate,
  updateDatabase,
  setLocalValue,
  onBlur,
}: Omit<InstantFieldProps<boolean>, "placeholder"> & { disabled: boolean }) {
  const [value, setValue] = useState<boolean>(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <input
      className={`rounded-md border-gray-400 bg-gray-200 indeterminate:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled}
      type={"checkbox"}
      checked={value}
      onChange={async (e) => {
        setValue(e.target.checked);
        const err = validate && (await validate(e.target.value == "on"));
        if (err) setError(err);
        else setError(null);
        const toastId = toast.loading("Ukladám...", { autoClose: false });
        const r = await updateDatabase(e.target.checked);
        if (r?.terminate) {
          toast.dismiss(toastId);
          onBlur && onBlur();
          setValue(defaultValue);
          return;
        }
        if (r?.error) {
          toast.update(toastId, {
            render: "Nastala chyba: " + r.error.message,
            type: "error",
            closeButton: true,
            isLoading: false,
          });
          setValue(defaultValue);
          return;
        }
        setLocalValue && (await setLocalValue(e.target.checked));
        toast.update(toastId, {
          render: "Uložené",
          type: "success",
          isLoading: false,
          autoClose: 1500,
        });
        onBlur && onBlur();
      }}
    />
  );
}

export function InstantTextAreaField({
  autoexpand,
  defaultValue,
  placeholder,
  className,
  validate,
  updateDatabase,
  setLocalValue,
  onBlur,
}: InstantFieldProps<string | null> & { autoexpand?: boolean }) {
  const [value, setValue] = useState<string>(defaultValue || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  function autosize(target: HTMLTextAreaElement) {
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 200) + 2 + "px";
  }

  return (
    <textarea
      className={`resize-none rounded-md border-gray-200 bg-gray-50 p-0 px-1 font-mono text-sm text-black hover:z-10 hover:border-gray-400 hover:shadow-lg focus:z-20 focus:border-gray-200 focus:shadow-lg ${
        error ? "bg-red-50 focus:border-red-500 focus:ring-red-500" : ""
      } ${autoexpand ? "overflow-hidden" : ""} ${className}`}
      value={value}
      rows={1}
      placeholder={placeholder}
      onFocus={(e) => {
        if (autoexpand) {
          autosize(e.target);
        }
      }}
      onChange={async (e) => {
        setValue(e.target.value);
        if (autoexpand) {
          autosize(e.target);
        }
        if (validate) {
          const err = await validate(e.target.value);
          if (err) setError(err);
          else setError(null);
        }
      }}
      onBlur={async (e) => {
        e.target.style.height = "auto";
        if (value == (defaultValue || "")) {
          return;
        }
        const err = validate && (await validate(value));
        if (err) {
          e.target.focus();
          setError(err);
          toast.error(err, {
            autoClose: 2000,
          });
          return;
        }
        setError(null);
        const toastId = toast.loading("Ukladám...", { autoClose: false });
        const r = await updateDatabase(value);
        if (r?.terminate) {
          toast.dismiss(toastId);
          onBlur && onBlur();
          setValue(defaultValue || "");
          return;
        }
        if (r?.error) {
          toast.update(toastId, {
            render: "Nastala chyba: " + r.error.message,
            type: "error",
            closeButton: true,
            isLoading: false,
          });
          setValue(defaultValue || "");
          return;
        }
        setLocalValue && (await setLocalValue(e.target.value));
        toast.update(toastId, {
          render: "Uložené",
          type: "success",
          isLoading: false,
          autoClose: 1500,
        });
        onBlur && onBlur();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setValue(defaultValue || "");
          (e.target as HTMLInputElement).blur();
        }
      }}
      onMouseEnter={(e) => {
        if (autoexpand) {
          autosize(e.target as HTMLTextAreaElement);
        }
      }}
      onMouseLeave={(e) => {
        if (autoexpand && document.activeElement !== e.target) {
          (e.target as HTMLTextAreaElement).style.height = "auto";
        }
      }}
    />
  );
}

export function InstantTextField({
  type = "text",
  defaultValue,
  placeholder = " - ",
  inline = false,
  className,
  validate,
  updateDatabase,
  setLocalValue,
  onBlur,
  autoFocus,
  trim = false,
  showAlways = true,
}: InstantFieldProps<string | null> & {
  type: "text" | "number" | "email" | "tel";
  inline?: boolean;
  trim?: boolean;
  showAlways?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(showAlways ? true : false);
  const [value, setValue] = useState<string>(defaultValue || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  const submit = async (v: string, refocus: () => void) => {
    const newValue = trim ? v.trim() : v;
    setValue(newValue);
    if (newValue == (defaultValue || "")) {
      onBlur && onBlur();
      !showAlways && setIsEditing(false);
      return;
    }
    const err = validate && (await validate(newValue));
    if (err) {
      refocus();
      setError(err);
      toast.error(err, {
        autoClose: 2000,
      });
      setValue(defaultValue || "");
      return;
    }
    setError(null);
    const toastId = toast.loading("Ukladám...", { autoClose: false });
    const r = await updateDatabase(newValue);
    if (r?.terminate) {
      toast.dismiss(toastId);
      onBlur && onBlur();
      setValue(defaultValue || "");
      !showAlways && setIsEditing(false);
      return;
    }
    if (r?.error) {
      refocus();
      toast.update(toastId, {
        render: "Nastala chyba: " + r.error.message,
        type: "error",
        closeButton: true,
        isLoading: false,
      });
      setValue(defaultValue || "");
      return;
    }
    setLocalValue && (await setLocalValue(newValue));
    toast.update(toastId, {
      render: "Uložené",
      type: "success",
      isLoading: false,
      autoClose: 1500,
    });
    onBlur && onBlur();
    !showAlways && setIsEditing(false);
  };

  return isEditing ? (
    <input
      type={type}
      className={`m-0.5 rounded-md border-gray-200 bg-gray-50 p-0 px-1 text-sm font-normal text-black placeholder:text-xs ${
        error ? "bg-red-50 focus:border-red-500 focus:ring-red-500" : ""
      } ${inline ? "font-mono" : ""} ${className}`}
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus || !showAlways}
      size={inline ? value?.length || placeholder?.length || 3 : undefined}
      onChange={async (e) => {
        setValue(e.target.value);
        if (validate) {
          const err = await validate(e.target.value);
          if (err) setError(err);
          else setError(null);
        }
        if (inline) e.target.size = e.target.value.length || 4;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === "Escape") {
          (e.target as HTMLInputElement).value = defaultValue || "";
          setValue(defaultValue || "");
          (e.target as HTMLInputElement).blur();
        }
      }}
      onBlur={(e) => {
        submit(e.target.value, () => e.target.focus());
      }}
    />
  ) : (
    <button
      className="group flex items-center gap-2"
      onClick={() => setIsEditing(true)}
    >
      <p className="text-start font-medium tracking-wider">{value}</p>
      <PencilIcon className="h-4 w-4 shrink-0 text-gray-500 opacity-0 transition-all group-hover:opacity-100" />
    </button>
  );
}

export function SubmitButton({
  isSubmitting,
  label = "Hotovo",
  submittingLabel = "Pracujem...",
  className = "",
}: {
  isSubmitting: boolean;
  label?: string;
  submittingLabel?: string;
  className?: string;
}) {
  return (
    <Button
      size={"sm"}
      type="submit"
      className={`mt-4 px-2 py-1 hover:shadow-none ${className}`}
      isProcessing={isSubmitting}
    >
      {isSubmitting ? submittingLabel : label}
    </Button>
  );
}
