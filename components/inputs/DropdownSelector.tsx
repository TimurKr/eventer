import InlineLoading from "../InlineLoading";
import { Badge, BadgeProps } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function DropdownSelector<
  T extends Record<
    string,
    { display?: string; variant: BadgeProps["variant"] }
  >,
>({
  value,
  onChange,
  options,
  label,
}: {
  value?: string;
  onChange: (newStatus: string) => void;
  options: T;
  label: string;
}) {
  if (!value) return <InlineLoading />;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Badge variant={options[value]?.variant || "outline"}>
          {options[value]?.display || value}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v)}
        >
          {Object.entries(options).map(([key, value]) => (
            <DropdownMenuRadioItem key={key} value={key}>
              <Badge
                variant={
                  (value as { variant: BadgeProps["variant"] })["variant"]
                }
              >
                {(value as { display?: string }).display || key}
              </Badge>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
