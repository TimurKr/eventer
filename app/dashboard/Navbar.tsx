"use client";

import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTheaterMasks, FaTicketAlt } from "react-icons/fa";
import { signOut } from "./serverActions";
import { Users } from "@/utils/supabase/database.types";

export default function Navbar({ profile }: { profile?: Users }) {
  const path = usePathname();

  return (
    <nav className="auto top-0 z-30 flex flex-none flex-row items-center gap-1 bg-inherit p-2 shadow-md">
      <p className="hidden px-4 text-lg font-bold tracking-wider md:inline">
        {profile?.business_name || "No name"}
      </p>
      {[
        {
          title: "Udalosti",
          href: "/dashboard/events",
          icon: <FaTheaterMasks className="h-5 w-5" />,
        },
        {
          title: "Kupóny",
          href: "/dashboard/coupons",
          icon: <FaTicketAlt className="h-5 w-5" />,
        },
      ].map((item) => (
        <Link
          key={item.href}
          className={`grid w-auto place-content-center rounded-lg p-2 md:block md:px-3 md:py-0.5 ${
            path.startsWith(`${item.href}`)
              ? "bg-white font-bold tracking-widest text-black hover:bg-gray-50"
              : "hover:bg-gray-50"
          } transition-all duration-200 ease-in-out`}
          href={item.href}
        >
          <span className="hidden md:block">{item.title}</span>
          <span className="block md:hidden">{item.icon}</span>
        </Link>
      ))}
      <form action={signOut} className="ms-auto w-auto">
        <button
          className="w-full rounded-lg bg-red-500 p-2 text-sm text-white hover:bg-red-600 md:px-3 md:py-1"
          type="submit"
        >
          <span className="hidden md:block">Odhlásiť</span>
          <span className="block md:hidden">
            <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
          </span>
        </button>
      </form>
    </nav>
  );
}
