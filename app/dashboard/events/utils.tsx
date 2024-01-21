import { Tickets } from "@/utils/supabase/database.types";

export function ticketSortFunction(a: Tickets, b: Tickets) {
  if (a.billing_name < b.billing_name) return -1;
  if (a.billing_name > b.billing_name) return 1;
  if (a.type != "VIP" && b.type == "VIP") return 1;
  if (a.type == "VIP" && b.type != "VIP") return -1;
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
}
