"use client";

import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTheaterMasks, FaTicketAlt } from "react-icons/fa";
import { HiCalendarDays } from "react-icons/hi2";
import { logOutClient } from "../auth/clientActions";

type route = {
  title: string;
  href: Route;
  icon: JSX.Element;
};

const routes: route[] = [
  {
    title: "Predstavenia",
    href: "/dashboard/services",
    icon: <FaTheaterMasks className="h-5 w-5" />,
  },
  {
    title: "Udalosti",
    href: "/dashboard/events",
    icon: <HiCalendarDays className="h-5 w-5" />,
  },
  {
    title: "Poukazy",
    href: "/dashboard/coupons",
    icon: <FaTicketAlt className="h-5 w-5" />,
  },
];

function PageLink({
  title,
  href,
  icon,
}: {
  title: string;
  href: Route;
  icon: JSX.Element;
}) {
  const path = usePathname();
  return (
    <Link
      key={title}
      className={`grid w-auto place-content-center rounded-lg p-2 md:block md:px-3 md:py-0.5 ${
        path.startsWith(`${href}`)
          ? "bg-stone-200 font-bold tracking-widest text-black cursor-default"
          : "hover:bg-stone-200"
      } transition-all duration-200 ease-in-out`}
      href={href}
    >
      <span className="hidden md:block">{title}</span>
      <span className="block md:hidden">{icon}</span>
    </Link>
  );
}

export default function Navbar() {
  const path = usePathname();

  return (
    <>
      {routes.map((item) => (
        <PageLink key={item.title + item.href} {...item} />
      ))}
      <button
        className="w-auto ms-auto rounded-lg bg-red-500 p-2 text-sm text-white hover:bg-red-600 md:px-3 md:py-1"
        type="button"
        onClick={() => logOutClient()} //TODO: clear local rxdb sotrage onlogout
      >
        <span className="hidden md:block">Odhlásiť</span>
        <span className="block md:hidden">
          <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
        </span>
      </button>
    </>
  );
}
