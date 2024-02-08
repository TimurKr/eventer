"use server";

import {
  Contacts,
  Events,
  InsertContacts,
  InsertTickets,
  Tickets,
} from "@/utils/supabase/database.types";
import { createServerSupabase } from "@/utils/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { ticketSortFunction } from "./utils";
import { randomUUID } from "crypto";
import { validateCoupon } from "../coupons/utils";

export async function fetchTicketTypes() {
  return {
    data: [
      { label: "VIP", max_sold: 6, price: 100 },
      { label: "standard", max_sold: 24, price: 80 },
    ],
    error: null,
  };
}

export type TicketTypes = Awaited<
  ReturnType<typeof fetchTicketTypes>
>["data"][0];

// Fetch events
export async function fetchEvents() {
  const r = await createServerSupabase(cookies(), [
    "events",
    "tickets",
    "contacts",
  ])
    .from("events")
    .select(
      `*,
      tickets (*,
        billing:contacts!tickets_billing_id_fkey(*),
        guest:contacts!tickets_guest_id_fkey(*),
        coupon_created:coupons!tickets_coupon_created_id_fkey(id, code),
        coupon_redeemed:coupons!tickets_coupon_redeemed_id_fkey(id, code)
        )`,
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

// Fetch all contacts
export async function fetchContacts() {
  const r = await createServerSupabase(cookies(), ["contacts", "tickets"])
    .from("contacts")
    .select();
  if (r.error) {
    return r;
  }
  return r;
}

// Create new event
export async function insertEvent(date: Date, isPublic: boolean) {
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

// Update event fields
export async function updateEventFields(
  event: Partial<EventWithTickets> & { id: NonNullable<Events["id"]> },
) {
  const supabase = createServerSupabase(cookies());
  const result = await supabase
    .from("events")
    .update(event)
    .match({ id: event.id });
  if (!result.error) {
    revalidateTag("events");
  }
  return result;
}

// Change event public status
export async function updateEventPublicStatus(
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

// Create new contacts
export async function bulkInsertContacts(contacts: InsertContacts[]) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase.from("contacts").insert(contacts).select();
  if (!res.error) {
    revalidateTag("contacts");
  }
  return res;
}

// Create new tickets
export async function bulkInsertTickets(tickets: InsertTickets[]) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase
    .from("tickets")
    .insert(tickets)
    .select(
      `*,
    billing:contacts!tickets_billing_id_fkey(*),
    guest:contacts!tickets_guest_id_fkey(*),
    coupon_created:coupons!tickets_coupon_created_id_fkey(id, code),
    coupon_redeemed:coupons!tickets_coupon_redeemed_id_fkey(id, code)`,
    );
  if (!res.error) {
    revalidateTag("tickets");
  }
  return res;
}

// Get coupon
export async function fetchCoupon(code: string) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .single();

  return res.data;
}

export async function validateCouponCode(code: string) {
  const coupon = await fetchCoupon(code);

  if (!coupon || !validateCoupon(coupon)) {
    return null;
  }
  return coupon;
}

// Redeem coupon
export async function redeemCoupon(couponID: number, newAmount: number) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase
    .from("coupons")
    .update({ amount: newAmount })
    .match({ id: couponID });
  if (!res.error) {
    revalidateTag("coupons");
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

// Bulk update ticket fields
export async function bulkUpdateTicketFields(
  ticketIDs: string[],
  ticket: Partial<Tickets>,
) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase.from("tickets").update(ticket).in("id", ticketIDs);
  if (!res.error) {
    revalidateTag("tickets");
  }
  return res;
}

// Update contact fields
export async function updateContactFields(
  contact: Partial<Contacts> & { id: NonNullable<Contacts["id"]> },
) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase
    .from("contacts")
    .update(contact)
    .match({ id: contact.id });
  if (!res.error) {
    revalidateTag("contacts");
  }
  return res;
}

// Delete ticket
export async function deleteTickets(ticketIds: Tickets["id"][]) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase.from("tickets").delete().in("id", ticketIds);
  if (!res.error) {
    revalidateTag("tickets");
  }
  return res;
}

// Bulk delete contacts
export async function deleteContacts(contactIDs: number[]) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase.from("contacts").delete().in("id", contactIDs);
  if (!res.error) {
    revalidateTag("contacts");
  }
  return res;
}

// Merge contacts
export async function mergeContacts(targetContact: Contacts) {
  const { id, created_at, ...contactFilter } = targetContact;
  const supabase = createServerSupabase(cookies());

  let q1 = supabase.from("contacts").select().neq("id", targetContact.id);
  for (const [key, value] of Object.entries(contactFilter)) {
    if (value == null) {
      q1 = q1.is(key, null);
    } else {
      q1 = q1.eq(key, value);
    }
  }
  const contactsQ = await q1;
  if (contactsQ.error) {
    return contactsQ;
  }

  const updateBillingQ = await supabase
    .from("tickets")
    .update({ billing_id: targetContact.id })
    .in(
      "billing_id",
      contactsQ.data.map((c) => c.id),
    );
  if (updateBillingQ.error) {
    return updateBillingQ;
  }
  const updateGuestQ = await supabase
    .from("tickets")
    .update({ guest_id: targetContact.id })
    .in(
      "guest_id",
      contactsQ.data.map((c) => c.id),
    );
  if (updateGuestQ.error) {
    return updateGuestQ;
  }

  let q2 = supabase.from("contacts").delete().neq("id", targetContact.id);
  for (const [key, value] of Object.entries(contactFilter)) {
    if (value == null) {
      q2 = q2.is(key, null);
    } else {
      q2 = q2.eq(key, value);
    }
  }
  const deleteQ = await q2;
  if (deleteQ.error) {
    return deleteQ;
  }
  return deleteQ;
}

// Convert tickets to coupon
export async function convertTicketsToCoupon(tickets: Tickets[]) {
  // TODO: implement transaction
  if (tickets.length == 0) {
    return { error: { message: "No tickets selected" } };
  }

  const supabase = createServerSupabase(cookies());
  let code = randomUUID().slice(0, 8).toUpperCase();

  while (true) {
    const { count } = await supabase
      .from("coupons")
      .select("*", { count: "exact", head: true })
      .eq("code", code);
    if (count == 0) {
      break;
    }
    code = randomUUID().slice(0, 8).toUpperCase();
  }
  const resCreate = await supabase
    .from("coupons")
    .insert({
      amount: tickets.map((t) => t.price).reduce((a, b) => a + b, 0),
      original_amount: tickets.map((t) => t.price).reduce((a, b) => a + b, 0),
      code: code,
    })
    .select();
  if (resCreate.error) {
    return resCreate;
  }

  const resCancel = await supabase
    .from("tickets")
    .update({
      payment_status: "zrušené",
      coupon_created_id: resCreate.data[0].id,
    })
    .in(
      "id",
      tickets.map((t) => t.id),
    );
  if (resCancel.error) {
    return resCancel;
  }

  revalidateTag("tickets");
  revalidateTag("coupons");
  return resCancel;
}
