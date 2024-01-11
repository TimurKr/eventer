"use client";

import { createBrowserSupabase } from "@/utils/supabase/client";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";

export default function Links() {
  const path = usePathname();

  const supabase = createBrowserSupabase();

  return [
    { title: "Predstavenia", href: "events" },
    { title: "Lístky", href: "tickets" },
  ].map((item) => (
    <Link
      key={item.href}
      className={
        "w-auto rounded-md px-4 py-1 pl-2 " +
        (path === `/dashboard/${item.href}`
          ? "bg-blue-100 font-black tracking-wide text-blue-500 hover:bg-blue-200"
          : "hover:bg-gray-200")
      }
      href={`${item.href}`}
    >
      {item.title}
    </Link>
  ));
}
