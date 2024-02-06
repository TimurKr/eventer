"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTheaterMasks, FaTicketAlt } from "react-icons/fa";

export default function Links() {
  const path = usePathname();

  return [
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
      className={
        "grid w-auto place-content-center rounded-lg p-2 md:block md:px-3 md:py-0.5 " +
        (path.startsWith(`${item.href}`)
          ? "bg-white font-bold tracking-widest text-black hover:bg-gray-50"
          : "hover:bg-gray-50")
      }
      href={item.href}
    >
      <span className="hidden md:block">{item.title}</span>
      <span className="block md:hidden">{item.icon}</span>
    </Link>
  ));
}
