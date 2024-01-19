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
import { HTMLInputTypeAttribute } from "react";

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
