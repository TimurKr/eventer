"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTheaterMasks, FaTicketAlt } from "react-icons/fa";

export default function Links() {
  const path = usePathname();

  return [
    {
      title: "Predstavenia",
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
      className={
        "grid w-auto place-content-center rounded-lg p-2 md:block md:px-3 md:py-0.5 " +
        (path.startsWith(`${item.href}`)
          ? "bg-cyan-700/70 font-bold tracking-widest text-white hover:bg-cyan-600"
          : "hover:bg-cyan-700/30")
      }
      href={item.href}
    >
      <span className="hidden md:block">{item.title}</span>
      <span className="block md:hidden">{item.icon}</span>
    </Link>
  ));
}
