"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format, isSameDay } from "date-fns";

import { Button, ButtonProps } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { sk } from "date-fns/locale";

export type DatePickerProps = {
  value?: Date;
  onChange: (date?: Date) => void;
  /**
   * Presets for quick selection
   */
  presets?: { label: string; value: Date }[];
  buttonProps?: ButtonProps;
  popoverProps?: React.ComponentPropsWithoutRef<typeof PopoverContent>;
};

export default function DatePicker({
  value,
  onChange,
  presets,
  buttonProps,
  popoverProps,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          {...buttonProps}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            buttonProps?.className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, "PPP", { locale: sk })
          ) : (
            <span>Vyberte si dátum</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "flex w-auto flex-col space-y-2 p-2",
          popoverProps?.className,
        )}
        {...popoverProps}
      >
        {presets?.length && (
          <Select
            value={value?.toDateString() || ""}
            onValueChange={(value) => onChange(new Date(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Možnosti" />
            </SelectTrigger>
            <SelectContent position="popper">
              {value && !presets?.find((p) => isSameDay(p.value, value)) && (
                <SelectItem value={value.toDateString()}>
                  <span className="font-medium">Iný</span>
                </SelectItem>
              )}
              {presets.map((preset) => (
                <SelectItem
                  key={preset.label}
                  value={preset.value.toDateString()}
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className={cn(presets?.length && "rounded-md border")}>
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            locale={sk}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
