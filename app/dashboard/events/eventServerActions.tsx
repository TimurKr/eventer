"use server";

import { createServerSupabase } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Create new event
export async function createNewEvent(date: Date, isPublic: boolean) {
  const supabase = createServerSupabase(cookies());
  const result = await supabase.from("events").insert([
    {
      datetime: date.toISOString(),
      is_public: isPublic,
    },
  ]);
  if (!result.error) {
    revalidatePath("/dashboard/events");
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
