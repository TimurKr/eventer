"use client";

import { PencilIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type FieldProps<Type> = {};

// export function SwitchField({
//   defaultValue,
//   className,
//   disabled = false,
//   validate,
//   updateValue,
//   onBlur,
// }: Omit<FieldProps<boolean>, "placeholder"> & { disabled: boolean }) {
//   const [value, setValue] = useState<boolean>(defaultValue);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     setValue(defaultValue);
//   }, [defaultValue]);

//   return (
//     <ToggleSwitch
//       className={`${className}`}
//       sizing={"sm"}
//       disabled={disabled}
//       checked={value}
//       onChange={async (newValue) => {
//         setValue(newValue);
//         const err = validate && (await validate(newValue));
//         if (err) setError(err);
//         else setError(null);
//         const toastId = toast.loading("Ukladám...", { autoClose: false });
//         const r = await updateDatabase(newValue);
//         if (r?.terminate) {
//           toast.dismiss(toastId);
//           onBlur && onBlur();
//           setValue(defaultValue);
//           return;
//         }
//         if (r?.error) {
//           toast.update(toastId, {
//             render: "Nastala chyba: " + r.error.message,
//             type: "error",
//             closeButton: true,
//             isLoading: false,
//           });
//           setValue(defaultValue);
//           return;
//         }
//         setLocalValue && (await setLocalValue(newValue));
//         toast.update(toastId, {
//           render: "Uložené",
//           type: "success",
//           isLoading: false,
//           autoClose: 1500,
//         });
//         onBlur && onBlur();
//       }}
//     />
//   );
// }

// export function CheckboxField({
//   defaultValue,
//   className,
//   disabled = false,
//   validate,
//   updateDatabase,
//   setLocalValue,
//   onBlur,
// }: Omit<FieldProps<boolean>, "placeholder"> & { disabled: boolean }) {
//   const [value, setValue] = useState<boolean>(defaultValue);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     setValue(defaultValue);
//   }, [defaultValue]);

//   return (
//     <input
//       className={`rounded-md border-gray-400 bg-gray-200 indeterminate:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
//       disabled={disabled}
//       type={"checkbox"}
//       checked={value}
//       onChange={async (e) => {
//         setValue(e.target.checked);
//         const err = validate && (await validate(e.target.value == "on"));
//         if (err) setError(err);
//         else setError(null);
//         const toastId = toast.loading("Ukladám...", { autoClose: false });
//         const r = await updateDatabase(e.target.checked);
//         if (r?.terminate) {
//           toast.dismiss(toastId);
//           onBlur && onBlur();
//           setValue(defaultValue);
//           return;
//         }
//         if (r?.error) {
//           toast.update(toastId, {
//             render: "Nastala chyba: " + r.error.message,
//             type: "error",
//             closeButton: true,
//             isLoading: false,
//           });
//           setValue(defaultValue);
//           return;
//         }
//         setLocalValue && (await setLocalValue(e.target.checked));
//         toast.update(toastId, {
//           render: "Uložené",
//           type: "success",
//           isLoading: false,
//           autoClose: 1500,
//         });
//         onBlur && onBlur();
//       }}
//     />
//   );
// }

type StringFieldProps = {
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  vertical?: boolean;
  className?: string;
  validate?: (value: string) => Promise<string | null>;
  updateValue: (value: string) => any;
  onBlur?: () => void;
  autoFocus?: boolean;
  inline?: boolean;
  trim?: boolean;
  showAlways?: boolean;
};

export function TextAreaField({
  autoexpand,
  defaultValue,
  placeholder,
  className,
  validate,
  updateValue,
  onBlur,
  autoFocus,
  inline,
  label,
  showAlways,
  trim,
  vertical,
}: StringFieldProps & { autoexpand?: boolean }) {
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
      autoFocus={autoFocus || !showAlways}
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
        await updateValue(value);
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

export function TextField({
  type = "text",
  defaultValue,
  placeholder = " - ",
  label,
  vertical,
  inline,
  className,
  validate,
  updateValue,
  onBlur,
  autoFocus,
  trim,
  showAlways,
}: StringFieldProps & {
  type: "text" | "number" | "email" | "tel";
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
        closeButton: true,
        autoClose: false,
      });
      setValue(defaultValue || "");
      return;
    }
    setError(null);
    await updateValue(newValue);
    onBlur && onBlur();
    !showAlways && setIsEditing(false);
  };

  return isEditing ? (
    <div
      className={`${
        inline ? "inline-flex" : vertical ? "flex flex-col" : "flex"
      } `}
    >
      {label && <label className="p-1 text-sm text-gray-600">{label}</label>}
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
    </div>
  ) : (
    <button
      className="group flex items-center gap-2"
      onClick={() => setIsEditing(true)}
    >
      <p
        className={`text-start font-medium tracking-wider ${
          value ? "" : "text-gray-500"
        }`}
      >
        {value || placeholder}
      </p>
      <PencilIcon className="h-4 w-4 shrink-0 text-gray-500 opacity-0 transition-all group-hover:opacity-100" />
    </button>
  );
}
