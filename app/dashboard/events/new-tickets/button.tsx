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
        onClick={(e) => e.stopPropagation()}
      >
        Vytvoriť lístok
      </Link>
    </Button>
  );
}
