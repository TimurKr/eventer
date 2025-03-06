"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { destroyDb } from "@/rxdb/db";
import {
  ArrowLeftStartOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { UserGroupIcon } from "@heroicons/react/24/solid";
import { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { FaTheaterMasks, FaTicketAlt } from "react-icons/fa";
import { HiCalendarDays } from "react-icons/hi2";

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
  {
    title: "Kontakty",
    href: "/dashboard/contacts",
    icon: <UserGroupIcon className="h-5 w-5" />,
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
    <Button
      variant={path.startsWith(href) ? "secondary" : "ghost"}
      className={cn(
        "p-2 transition-all duration-200 ease-in-out md:px-3",
        path.startsWith(href) && "font-semibold tracking-wider",
      )}
      asChild
    >
      <Link href={href}>
        <span className="hidden md:block">{title}</span>
        <span className="block md:hidden">{icon}</span>
      </Link>
    </Button>
  );
}

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const posthog = usePostHog();

  return (
    <>
      {routes.map((item) => (
        <PageLink key={item.title + item.href} {...item} />
      ))}
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={"icon"} className="ms-auto">
            <UserCircleIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/change-password">Zmeniť heslo</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={async () => {
              posthog.reset();
              await destroyDb();
              await createBrowserSupabase().auth.signOut();
              router.push("/auth/login");
            }}
          >
            <ArrowLeftStartOnRectangleIcon className="me-2 h-5 w-5" />
            Odhlásiť
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
