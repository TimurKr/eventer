"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { addDays, differenceInDays, format } from "date-fns";

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
   * Presets for quick selection, value is number of days to add to current date
   */
  presets?: { label: string; value: number }[];
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
            value={(
              differenceInDays(value || new Date(), new Date()) + 1
            ).toString()}
            onValueChange={(value) =>
              onChange(addDays(new Date(), parseInt(value)))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Možnosti" />
            </SelectTrigger>
            <SelectContent position="popper">
              {!presets?.find(
                (p) => p.value === differenceInDays(value || 0, new Date()) + 1,
              ) && (
                <SelectItem
                  value={(
                    differenceInDays(value || 0, new Date()) + 1
                  ).toString()}
                >
                  <span className="font-medium">Iný</span>
                </SelectItem>
              )}
              {presets?.map((preset) => (
                <SelectItem key={preset.value} value={preset.value.toString()}>
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
