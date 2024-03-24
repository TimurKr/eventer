"use client";

import CouponRow from "@/components/CouponRow";
import Loading from "@/components/Loading";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRxData } from "@/rxdb/db";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import Header from "../../../components/Header";
import NewCouponButton from "./new/button";
import NewCouponForm from "./new/form";
import { searchCoupons } from "./utils";

export default function Coupons() {
  const q = useSearchParams().get("query");
  const [query, setQuery] = useState(q || "");

  const { result: allCoupons, isFetching: isFetchingCoupons } = useRxData(
    "coupons",
    useCallback((c) => c.find(), []),
    { initialResult: [] },
  );

  const { result: allContacts, isFetching: isFetchingContacts } = useRxData(
    "contacts",
    useCallback(
      (c) =>
        c.find({
          selector: { id: { $in: allCoupons?.map((c) => c.contact_id) || [] } },
        }),
      [allCoupons],
    ),
    { hold: isFetchingCoupons },
  );

  const coupons = useMemo(
    () =>
      searchCoupons(query, {
        coupons: allCoupons,
        contacts: allContacts,
      }),
    [query, allContacts, allCoupons],
  );

  return (
    <>
      <Header
        title="Poukazy"
        actionButton={<NewCouponButton />}
        search={{
          search: (query) => setQuery(query),
          query,
          resultsCount: coupons.length || 0,
        }}
        refresh={{ isRefreshing: isFetchingCoupons }}
      />
      <div className="p-4 pt-0">
        {coupons.length > 0 ? (
          <Table className="">
            <TableHeader>
              <TableRow className="first:*:rounded-tl-lg last:*:rounded-tr-lg">
                <TableHead className="px-2 text-start">Kód</TableHead>
                <TableHead className="px-2 text-center">Kontakt</TableHead>
                <TableHead className="text-end">Suma</TableHead>
                <TableHead className="text-end">
                  Platí do:{" "}
                  <span className="text-xs font-light text-gray-500">
                    (vrátane)
                  </span>
                </TableHead>
                <TableHead className="text-center">Stav</TableHead>
                <TableHead className="pe-2 text-end">Poznámka</TableHead>
                <TableHead className="pe-2 text-end">Použité pri</TableHead>
                <TableHead className="pe-2 text-end">Vytvorené z</TableHead>
                <TableHead className=""></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map(({ coupon, contact }) => (
                <CouponRow key={coupon.id} coupon={coupon} contact={contact} />
              ))}
            </TableBody>
          </Table>
        ) : isFetchingContacts ? (
          <Loading text="Načítavam poukazy..." />
        ) : query ? (
          <div className="flex flex-col items-center p-10">
            <MagnifyingGlassIcon className="w-12 animate-wiggle text-gray-400" />
            <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
              Nenašli sme žiadne poukazy vyhovujúce vášmu hladaniu...
            </p>
            <NewCouponButton />
          </div>
        ) : (
          <div className="flex flex-col items-center p-10">
            <RocketLaunchIcon className="w-12 text-gray-400" />
            <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
              Nemáte žiadne vytvorené poukazy. Vytvorte si svoj prvý:
            </p>
            <div className="rounded-2xl border border-gray-200 p-4 shadow-md">
              <NewCouponForm onSubmit={() => {}} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
