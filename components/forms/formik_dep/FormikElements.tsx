"use client";

import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Badge } from "flowbite-react";
import { Field, FieldMetaProps, FieldProps, useField } from "formik";

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
  //TODO : TextField with optional Formik prop
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
              <label
                className="p-1 text-sm text-gray-600"
                htmlFor={props.field.name}
              >
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
                  {(props.field.value === undefined ||
                    props.field.value === "") &&
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
  onChange,
  iconStart,
}: {
  children: React.ReactNode;
  name: string;
  className?: string;
  vertical?: boolean;
  label?: string;
  onChange?: (v: string) => void;
  iconStart?: React.ReactNode;
}) => {
  const [field, meta, helpers] = useField(name);
  field;
  return (
    <div
      className={`relative w-full ${
        vertical ? "" : "flex flex-row items-center justify-between gap-8"
      }`}
    >
      {label && (
        <label className="p-1 text-sm text-gray-600" htmlFor={field.name}>
          {label}
        </label>
      )}
      {iconStart && (
        <div className="absolute inset-y-0 left-1 grid items-center p-1">
          {iconStart}
        </div>
      )}
      <select
        {...field}
        onChange={(e) => {
          field.onChange(e);
          onChange && onChange(e.target.value);
        }}
        className={`ms-auto w-full rounded-lg border-gray-200 bg-gray-50 py-1 ${
          className || ""
        } ${iconStart ? "pl-7" : ""}`}
      >
        {children}
      </select>
      <CustomErrorMessage fieldMeta={meta} />
    </div>
  );
};

export const FormikCheckboxField = ({
  name,
  label,
  className,
  vertical = false,
}: {
  name: string;
  label?: string;
  className?: string;
  vertical?: boolean;
}) => (
  <Field name={name} type="checkbox">
    {(props: FieldProps) => (
      <div
        className={`flex w-full  ${
          vertical
            ? "flex-col items-end"
            : "flex-row items-center justify-between gap-8"
        }`}
      >
        {label && (
          <label
            className="p-1 text-sm text-gray-600"
            htmlFor={props.field.name}
          >
            {label}
          </label>
        )}
        <div>
          <input
            type="checkbox"
            // id={name + label}
            className={`h-5 w-5 rounded-md border border-gray-200 bg-gray-50 ${className}`}
            {...props.field}
          />
        </div>
      </div>
    )}
  </Field>
);
