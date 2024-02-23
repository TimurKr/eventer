"use server";

import {
  Coupons,
  Events,
  InsertContacts,
  InsertEvents,
  InsertTickets,
  Tickets,
  UpdateEvents,
} from "@/utils/supabase/database.types";
import { createServerSupabase } from "@/utils/supabase/server";
import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { validateCoupon } from "../coupons/utils";
import { ticketSortFunction } from "./utils";

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
        coupon_created:coupons!public_tickets_coupon_created_id_fkey(id, code),
        coupon_redeemed:coupons!public_tickets_coupon_redeemed_id_fkey(id, code),
        type:ticket_types!public_tickets_type_id_fkey(*)
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
        tickets: [...event.tickets.filter((t) => t.payment_status != "zrušené")]
          .map((t) => ({ ...t, type: t.type! }))
          .sort(ticketSortFunction),
        cancelled_tickets: [
          ...event.tickets.filter((t) => t.payment_status == "zrušené"),
        ]
          .map((t) => ({ ...t, type: t.type! }))
          .sort(ticketSortFunction),
      };
    }),
  };
}

export type EventWithTickets = NonNullable<
  Awaited<ReturnType<typeof fetchEvents>>["data"]
>[0];

// Fetch all contacts
export async function fetchContacts() {
  const r = await createServerSupabase(cookies(), ["contacts"]).from("contacts")
    .select(`*,
      guest_usage:tickets!public_tickets_guest_id_fkey(count),
      billing_usage:tickets!public_tickets_billing_id_fkey(count)
      `);
  if (r.error) {
    return r;
  }
  return {
    ...r,
    data: r.data?.map((c) => {
      const { guest_usage, billing_usage, ...rest } = c;
      return {
        ...rest,
        // @ts-expect-error - Supabase doesnt infer count correctly
        usage_count: (c.guest_usage[0].count +
          // @ts-expect-error - Supabase doesnt infer count correctly
          c.billing_usage[0].count) as number,
      };
    }),
  };
}

export type Contacts = NonNullable<
  Awaited<ReturnType<typeof fetchContacts>>["data"]
>[0];

// Create new event
export async function insertEvent(event: InsertEvents) {
  const supabase = createServerSupabase(cookies());
  const result = await supabase.from("events").insert(event).select();
  if (!result.error) {
    revalidateTag("events");
  }
  return result;
}

// Delete event
export async function deleteEvent(eventId: Events["id"]) {
  const supabase = createServerSupabase(cookies());
  const result = await supabase.from("events").delete().match({ id: eventId });
  if (!result.error) {
    revalidatePath("/dashboard/events");
  }
  return result;
}

// Update event fields
export async function updateEvent(event: UpdateEvents & { id: Events["id"] }) {
  const supabase = createServerSupabase(cookies());
  const result = await supabase
    .from("events")
    .update(event)
    .match({ id: event.id })
    .select();
  if (!result.error) {
    revalidateTag("events");
  }
  return result;
}

// Change event public status
// export async function updateEventPublicStatus(
//   eventId: number,
//   isPublic: boolean,
// ) {
//   const supabase = createServerSupabase(cookies());
//   const result = await supabase
//     .from("events")
//     .update({ is_public: isPublic })
//     .match({ id: eventId });
//   if (!result.error) {
//     revalidatePath("/dashboard/events");
//   }
//   return result;
// }

// Create new contacts
// export async function bulkInsertContacts(contacts: InsertContacts[]) {
//   const supabase = createServerSupabase(cookies());
//   const res = await supabase.from("contacts").insert(contacts).select();
//   if (!res.error) {
//     revalidateTag("contacts");
//   }
//   return res;
// }

// bulk Upsert contacts
export async function bulkUpsertContacts(contacts: InsertContacts[]) {
  const supabase = createServerSupabase(cookies());
  const res = await supabase
    .from("contacts")
    .upsert(contacts, {
      onConflict: "name,email,phone,address",
      ignoreDuplicates: false,
      defaultToNull: false,
    })
    .select();
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
      billing:contacts!public_tickets_billing_id_fkey(*),
      guest:contacts!public_tickets_guest_id_fkey(*),
      coupon_created:coupons!public_tickets_coupon_created_id_fkey(id, code),
      coupon_redeemed:coupons!public_tickets_coupon_redeemed_id_fkey(id, code),
      type:ticket_types!public_tickets_event_id_fkey(*)
      `,
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
export async function redeemCoupon(couponID: Coupons["id"], newAmount: number) {
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
  ticket: Partial<Tickets> & {
    id: NonNullable<Tickets["id"]>;
  },
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
// export async function deleteContacts(contactIDs: number[]) {
//   const supabase = createServerSupabase(cookies());
//   const res = await supabase.from("contacts").delete().in("id", contactIDs);
//   if (!res.error) {
//     revalidateTag("contacts");
//   }
//   return res;
// }

// Merge contacts
// export async function mergeContacts(targetContact: Contacts) {
//   const { id, created_at, ...contactFilter } = targetContact;
//   const supabase = createServerSupabase(cookies());

//   let q1 = supabase.from("contacts").select().neq("id", targetContact.id);
//   for (const [key, value] of Object.entries(contactFilter)) {
//     if (value == null) {
//       q1 = q1.is(key, null);
//     } else {
//       q1 = q1.eq(key, value);
//     }
//   }
//   const contactsQ = await q1;
//   if (contactsQ.error) {
//     return contactsQ;
//   }

//   const updateBillingQ = await supabase
//     .from("tickets")
//     .update({ billing_id: targetContact.id })
//     .in(
//       "billing_id",
//       contactsQ.data.map((c) => c.id),
//     );
//   if (updateBillingQ.error) {
//     return updateBillingQ;
//   }
//   const updateGuestQ = await supabase
//     .from("tickets")
//     .update({ guest_id: targetContact.id })
//     .in(
//       "guest_id",
//       contactsQ.data.map((c) => c.id),
//     );
//   if (updateGuestQ.error) {
//     return updateGuestQ;
//   }

//   let q2 = supabase.from("contacts").delete().neq("id", targetContact.id);
//   for (const [key, value] of Object.entries(contactFilter)) {
//     if (value == null) {
//       q2 = q2.is(key, null);
//     } else {
//       q2 = q2.eq(key, value);
//     }
//   }
//   const deleteQ = await q2;
//   if (deleteQ.error) {
//     return deleteQ;
//   }
//   return deleteQ;
// }

/**
 * Merges a contact with another contact by updating references in related entities and deleting the original contact.
 * @param deleteContact - The contact to be deleted.
 * @param contactDiff - The partial contact object containing the updated contact information.
 * @returns A promise that resolves to the result of the delete operation, or any other that failed.
 */
export async function mergeContacts(
  deleteContact: Contacts,
  contactDiff: Partial<Contacts>,
) {
  // TODO: implement transaction
  const supabase = createServerSupabase(cookies());
  // Fetch target contact
  const resTarget = await supabase
    .from("contacts")
    .select()
    .match({
      name: contactDiff.name || deleteContact.name,
      email: contactDiff.email || deleteContact.email,
      phone: contactDiff.phone || deleteContact.phone,
      address: contactDiff.address || deleteContact.address,
    })
    .single();
  if (resTarget.error) {
    return resTarget;
  }
  // Wherever deleteContact is used, replace it with targetContact
  const resBilling = await supabase
    .from("tickets")
    .update({ billing_id: resTarget.data.id })
    .eq("billing_id", deleteContact.id);
  if (resBilling.error) {
    return resBilling;
  }
  const resGuest = await supabase
    .from("tickets")
    .update({ guest_id: resTarget.data.id })
    .eq("guest_id", deleteContact.id);
  if (resGuest.error) {
    return resGuest;
  }
  const resCoupon = await supabase
    .from("coupons")
    .update({ contact_id: resTarget.data.id })
    .eq("contact_id", deleteContact.id);
  if (resCoupon.error) {
    return resCoupon;
  }
  // Delete contact
  const resDelete = await supabase
    .from("contacts")
    .delete()
    .eq("id", deleteContact.id);
  if (!resDelete.error) {
    revalidateTag("contacts");
  }
  return resDelete;
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
