"use client";

import { cn } from "@/lib/utils";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type InstantFieldProps<T> = {
  defaultValue: T;
  /**
   * Function that will change the value in the backed.
   * Returns the new value, throws an error on error.
   *
   * @param v New value
   * @returns
   */
  updateValue: (v: T) => Promise<T>;
  placeholder?: string;
  label?: string;
  vertical?: boolean;
  className?: string;
  validate?: (value: T) => Promise<string | null>;
  onBlur?: () => void;
  autoFocus?: boolean;
};

export function InstantTextAreaField({
  autoexpand,
  defaultValue,
  placeholder,
  className,
  validate,
  updateValue,
  onBlur,
}: InstantFieldProps<string> & { autoexpand?: boolean }) {
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
        await updateValue(value)
          .then((r) => {
            setValue(r);
            onBlur && onBlur();
          })
          .catch((error) => {
            setError(error.message);
            e.target.focus();
          });
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
  updateValue,
  placeholder = " - ",
  label,
  vertical,
  inline = false,
  className,
  validate,
  onBlur,
  autoFocus,
  trim = false,
  showAlways = true,
  baseClassName,
}: InstantFieldProps<string> & {
  type?: "text" | "number" | "email" | "tel";
  inline?: boolean;
  trim?: boolean;
  showAlways?: boolean;
  baseClassName?: string;
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
      setError(null);
      toast.error(err, {
        closeButton: true,
        autoClose: false,
      });
      setValue(defaultValue || "");
      return;
    }
    setError(null);

    await updateValue(newValue)
      .then((r) => {
        setValue(r);
        onBlur && onBlur();
        !showAlways && setIsEditing(false);
      })
      .catch((e) => {
        setError(e.message);
        refocus();
      });
  };
  return (
    <div
      className={cn(
        "flex",
        inline && "inline-flex",
        vertical && "flex-col",
        baseClassName,
      )}
    >
      {label && <Label className="px-2 pb-1">{label}</Label>}
      {isEditing ? (
        <Input
          type={type}
          error={!!error}
          className={cn(
            "px-3 py-1",
            !vertical && label ? "" : "grow",
            inline && "p-0 px-1 font-mono",
            className,
          )}
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
              setError(null);
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
          <p
            className={`text-start font-medium tracking-wider ${
              value ? "" : "text-gray-500"
            }`}
          >
            {value || placeholder}
          </p>
          <PencilIcon className="h-4 w-4 shrink-0 text-gray-500 opacity-0 transition-all group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
