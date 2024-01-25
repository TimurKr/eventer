"use client";

import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Badge, Button } from "flowbite-react";
import {
  ErrorMessage,
  Field,
  FieldMetaProps,
  FieldProps,
  GenericFieldHTMLAttributes,
} from "formik";
import { HTMLInputTypeAttribute, useEffect, useState } from "react";
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

type GenericTextFieldProps = {
  name: string;
  optional?: boolean;
  vertical?: boolean;
  type?: "text" | "password" | "email" | "texarea";
  placeHolder?: string;
  label?: string;
  hideErrors?: boolean;
  className?: string;
};

// // Define input types
export const GenericTextField = ({
  name,
  optional = false,
  vertical = false,
  type = "text",
  placeHolder,
  label,
  hideErrors,
  className,
}: GenericTextFieldProps) => (
  <>
    <Field name={name}>
      {(props: FieldProps) => {
        return (
          <div
            className={`w-full ${
              vertical ? "" : "flex flex-row justify-between gap-8"
            }`}
          >
            {label && (
              <label className="p-1 text-gray-700" htmlFor={props.field.name}>
                {label}
              </label>
            )}
            <div className="basis-3/4">
              <div
                className={`relative w-full items-center rounded-lg bg-white text-sm shadow-md ${
                  !hideErrors && props.meta.error ? "border border-red-500" : ""
                } ${className}`}
              >
                <input
                  className={`m-0 w-full flex-row rounded-lg border-none bg-transparent py-1 placeholder:text-gray-400`}
                  type={type}
                  {...props.field}
                  placeholder={placeHolder}
                />
                {(!props.field.value || props.field.value.length < 5) && (
                  <div className="absolute inset-y-0 right-0 grid items-center p-1">
                    {optional ? (
                      <Badge color={"gray"}>Volitelné</Badge>
                    ) : (
                      <Badge color={"red"}>Povinné</Badge>
                    )}
                  </div>
                )}
              </div>
              {hideErrors || <CustomErrorMessage fieldMeta={props.meta} />}
            </div>
          </div>
        );
      }}
    </Field>
  </>
);

export function InstantInput({
  type = "text",
  defaultValue,
  placeholder = " - ",
  inline = false,
  className,
  validate,
  updateDatabase,
  setLocalValue,
}: {
  type: "text" | "number" | "email" | "tel";
  defaultValue?: string | null;
  placeholder?: string;
  inline?: boolean;
  className?: string;
  validate?: (value: string) => Promise<string | null>;
  updateDatabase: (value: string) => Promise<any>;
  setLocalValue: (value: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState<string>(defaultValue || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  return (
    <input
      type={type}
      className={`m-0.5 rounded-md border-gray-200 bg-gray-50 p-0 px-1 text-sm font-normal text-black placeholder:text-xs ${
        error ? "bg-red-50 focus:border-red-500 focus:ring-red-500" : ""
      } ${inline ? "font-mono" : ""} ${className}`}
      value={value}
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
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onBlur={async (e) => {
        if (value == (defaultValue || "")) {
          setError(null);
          return;
        }
        const err = validate && (await validate(value));
        if (err) {
          e.target.focus();
          setError(err);
          toast.error(err, {
            autoClose: 2000,
          });
          setValue(defaultValue || "");
          return;
        }
        setError(null);
        const toastId = toast.loading("Ukladám...", { autoClose: false });
        const r = await updateDatabase(value);
        if (r.error) {
          toast.update(toastId, {
            render: "Nastala chyba: " + r.error.message,
            type: "error",
            closeButton: true,
          });
          setValue(defaultValue || "");
          return;
        }
        await setLocalValue(e.target.value);
        toast.update(toastId, {
          render: "Uložené",
          type: "success",
          isLoading: false,
          autoClose: 1000,
        });
      }}
    />
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
