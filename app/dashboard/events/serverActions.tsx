"use server";

import { InsertTickets, Tickets } from "@/utils/supabase/database.types";
import { createServerSupabase } from "@/utils/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { ticketSortFunction } from "./utils";

// Fetch events
export async function fetchEvents() {
  const r = await createServerSupabase(cookies(), ["events", "tickets"])
    .from("events")
    .select(
      `*,
      tickets (*)`,
    )
    .order("datetime", { ascending: false });
  if (r.error) {
    return r;
  }
  return {
    ...r,
    data: r.data.map((event) => {
      return {
        ...event,
        tickets: [
          ...event.tickets.filter((t) => t.payment_status != "zrušené"),
        ].sort(ticketSortFunction),
        cancelled_tickets: [
          ...event.tickets.filter((t) => t.payment_status == "zrušené"),
        ].sort(ticketSortFunction),
      };
    }),
  };
}

export type EventWithTickets = NonNullable<
  Awaited<ReturnType<typeof fetchEvents>>["data"]
>[0];

// Create new event
export async function createNewEvent(date: Date, isPublic: boolean) {
  const supabase = createServerSupabase(cookies());
  const result = await supabase
    .from("events")
    .insert([
      {
        datetime: date.toISOString(),
        is_public: isPublic,
      },
    ])
    .select();
  if (!result.error) {
    revalidateTag("events");
  }
  return result;
}

// Delete event
export async function deleteEvent(eventId: number) {
  const supabase = createServerSupabase(cookies());
  const result = await supabase.from("events").delete().match({ id: eventId });
  if (!result.error) {
    revalidatePath("/dashboard/events");
  }
  return result;
}

// Change event public status
export async function changeEventPublicStatus(
  eventId: number,
  isPublic: boolean,
) {
  const supabase = createServerSupabase(cookies());
  const result = await supabase
    .from("events")
    .update({ is_public: isPublic })
    .match({ id: eventId });
  if (!result.error) {
    revalidatePath("/dashboard/events");
  }
  return result;
}

// Create new tickets
export async function bulkCreateTickets(tickets: InsertTickets[]) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase.from("tickets").insert(tickets).select();
  if (!res.error) {
    revalidateTag("tickets");
  }
  return res;
}

// Update ticket payment status
export async function updateTicketPaymentStatus(
  ticketIDs: string[],
  paymentStatus: string,
) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase
    .from("tickets")
    .update({ payment_status: paymentStatus })
    .in("id", ticketIDs);
  if (!res.error) {
    revalidateTag("tickets");
  }
  return res;
}

// Update ticket fields
export async function updateTicketFields(
  ticket: Partial<Tickets> & { id: NonNullable<Tickets["id"]> },
) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase
    .from("tickets")
    .update(ticket)
    .match({ id: ticket.id });
  if (!res.error) {
    revalidateTag("tickets");
  }
  return res;
}

// Delete ticket
export async function deleteTicket(ticketID: string) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase.from("tickets").delete().match({ id: ticketID });
  if (!res.error) {
    revalidateTag("tickets");
  }
  return res;
}
