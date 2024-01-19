"use server";

import { InsertTickets } from "@/utils/supabase/database.types";
import { createServerSupabase } from "@/utils/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
