"use client";

import { createBrowserSupabase } from "@/utils/supabase/client";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";

export default function Links() {
  const path = usePathname();

  const supabase = createBrowserSupabase();

  return [
    { title: "Predstavenia", href: "/dashboard/events" },
    { title: "Kupóny", href: "/dashboard/coupons" },
  ].map((item) => (
    <Link
      key={item.href}
      className={
        "w-auto rounded-lg px-4 py-1 pl-2 " +
        (path.startsWith(`${item.href}`)
          ? "bg-cyan-700/70 font-bold tracking-widest text-white hover:bg-cyan-600"
          : "hover:bg-cyan-700/30")
      }
      href={item.href}
    >
      {item.title}
    </Link>
  ));
}
