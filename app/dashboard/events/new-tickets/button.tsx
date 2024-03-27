import { Button, ButtonProps } from "@/components/ui/button";
import Link from "next/link";

export default function NewTicketsButton(
  params: {
    eventId: string;
    couponCode?: string;
  } & ButtonProps,
) {
  const { eventId, couponCode, ...buttonProps } = params;
  return (
    <Button asChild variant={"default"} size={"xs"} {...buttonProps}>
      <Link
        href={{
          pathname: "/dashboard/events/new-tickets",
          query: {
            eventId: eventId,
            couponCode: couponCode,
          },
        }}
        // className="rounded-md bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
        onClick={(e) => e.stopPropagation()}
      >
        Vytvoriť lístok
      </Link>
    </Button>
  );
}
