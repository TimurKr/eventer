"use client";

import InlineLoading from "@/components/InlineLoading";
import Loading from "@/components/Loading";
import {
  InstantTextAreaField,
  InstantTextField,
} from "@/components/forms/InstantFields";
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import {
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Badge, Datepicker } from "flowbite-react";
import moment from "moment";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { number as yupNumber } from "yup";
import Header from "../../../components/Header";
import UseCouponSelectEvent from "./modals/UseCouponSelectEventModal";
import NewCouponButton from "./new/button";
import NewCouponForm from "./new/form";
import { searchCoupons, validateCoupon } from "./utils";

function CouponRow({
  coupon,
  contact,
}: {
  coupon: CouponsDocument;
  contact?: ContactsDocument;
}) {
  const { result: redeemedAt, isFetching: isFetchingRedemptions } = useRxData(
    "tickets",
    useCallback(
      (c) => c.find({ selector: { coupon_redeemed_id: coupon.id } }),
      [coupon.id],
    ),
    { initialResult: [] },
  );

  const { result: createdFrom, isFetching: isFetchingCreations } = useRxData(
    "tickets",
    useCallback(
      (c) => c.find({ selector: { coupon_created_id: coupon.id } }),
      [coupon.id],
    ),
    { initialResult: [] },
  );

  return (
    <tr key={coupon.id} className="border-t first:border-none">
      <td className="p-1 px-2">{coupon.code}</td>
      <td>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 py-0.5">
          {contact && (
            <Link
              href={`/dashboard/contacts/${contact.id.toString()}`}
              className="p-1 flex items-center gap-2 group transition-all duration-100 hover:underline hover:text-blue-600 active:text-blue-700"
            >
              {contact ? contact.name : "-"}
              <ArrowTopRightOnSquareIcon className="w-4 group-hover:scale-105 " />
            </Link>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-2 text-end">
        <InstantTextField
          type="text"
          defaultValue={coupon.amount.toString()}
          inline
          validate={(value) =>
            yupNumber()
              .min(0, "Suma musí byť kladné číslo")
              .required("Suma je povinná")
              .validate(value)
              .then(() => null)
              .catch((err) => err.message)
          }
          updateValue={async (value) =>
            coupon.patch({ amount: parseFloat(value!) })
          }
        />{" "}
        /{" "}
        <InstantTextField
          type="text"
          defaultValue={coupon.original_amount.toString()}
          inline
          validate={(value) =>
            yupNumber()
              .min(0, "Suma musí byť kladné číslo")
              .required("Suma je povinná")
              .validate(value)
              .then(() => null)
              .catch((err) => err.message)
          }
          updateValue={async (value) =>
            coupon.patch({ original_amount: parseFloat(value!) })
          }
        />{" "}
        €
      </td>
      <td className="">
        <div className="flex w-full items-center justify-end">
          {coupon.valid_until ? (
            <>
              <div className="py-0.5">
                <Datepicker
                  language="sk-SK"
                  autoHide
                  showClearButton={false}
                  showTodayButton={false}
                  defaultDate={new Date(coupon.valid_until)}
                  weekStart={1}
                  onSelectedDateChanged={(date) =>
                    coupon.incrementalPatch({
                      valid_until: date?.toDateString(),
                    })
                  }
                  theme={{
                    root: {
                      input: {
                        field: {
                          input: {
                            base: "!py-0.5 text-sm text-end !px-2 font-mono",
                          },
                          icon: { base: "hidden" },
                        },
                      },
                    },
                  }}
                />
                <p className="px-2 text-end text-xs text-gray-500">
                  {moment(coupon.valid_until).endOf("day").fromNow()}
                </p>
              </div>
              <button
                type="button"
                className="p-2 transition-all duration-100 hover:scale-110 hover:text-red-500 active:text-red-700"
                onClick={() =>
                  coupon.incrementalPatch({
                    valid_until: undefined,
                  })
                }
              >
                <XCircleIcon className="w-4" />
              </button>
            </>
          ) : (
            <>
              <p className="px-2 text-gray-500">-</p>
              <button
                type="button"
                className="p-2 transition-all duration-100 hover:scale-110 hover:text-green-500 active:text-green-700"
                onClick={(date) =>
                  coupon.incrementalPatch({
                    valid_until: moment()
                      .add(1, "month")
                      .toDate()
                      .toDateString(),
                  })
                }
              >
                <PlusCircleIcon className="w-4" />
              </button>
            </>
          )}
        </div>
      </td>
      <td className="text-center">
        {validateCoupon(coupon) ? (
          <div className="mx-auto w-fit">
            <Badge color="success">Platné</Badge>
          </div>
        ) : (
          <div className="mx-auto w-fit">
            <Badge color="failure" className="w-fit">
              Neplatné
            </Badge>
          </div>
        )}
      </td>
      <td className="relative w-24 overflow-clip p-1 text-end has-[:focus]:overflow-visible has-[:hover]:overflow-visible">
        <InstantTextAreaField
          autoexpand
          className="absolute inset-y-auto end-0 w-full -translate-y-1/2 transition-all duration-300 ease-in-out hover:w-64 focus:w-64"
          defaultValue={coupon.note || ""}
          placeholder="Poznámka"
          updateValue={async (value) =>
            coupon.incrementalPatch({ note: value || undefined })
          }
        />
      </td>
      <td>
        {isFetchingRedemptions ? (
          <InlineLoading />
        ) : redeemedAt.length > 0 ? (
          <div className="flex w-full items-center justify-end px-2 text-end text-xs text-gray-500">
            ({redeemedAt.length})
            <Link
              href={{
                pathname: "/dashboard/events",
                query: {
                  query: "=" + redeemedAt.map((t) => t.id).join("|="),
                },
              }}
            >
              <ArrowTopRightOnSquareIcon className="ms-auto h-6 w-6 p-1 hover:scale-105 hover:cursor-pointer active:scale-110" />
            </Link>
          </div>
        ) : (
          <p className="px-2 text-end text-gray-600">-</p>
        )}
      </td>
      <td>
        {isFetchingCreations ? (
          <InlineLoading />
        ) : createdFrom.length > 0 ? (
          <div className="flex w-full items-center justify-end px-2 text-end text-xs text-gray-500">
            ({createdFrom.length})
            <Link
              href={{
                pathname: "/dashboard/events",
                query: {
                  query: "=" + createdFrom.map((t) => t.id).join("|="),
                },
              }}
            >
              <ArrowTopRightOnSquareIcon className="ms-auto h-6 w-6 p-1 hover:scale-105 hover:cursor-pointer active:scale-110" />
            </Link>
          </div>
        ) : (
          <p className="px-2 text-end text-gray-600">-</p>
        )}
      </td>
      <td>
        <div className="flex items-center justify-end gap-2">
          {validateCoupon(coupon) && <UseCouponSelectEvent coupon={coupon} />}
          <button
            className="p-2 transition-all duration-100 hover:scale-110 hover:text-red-500 active:text-red-700"
            onClick={() => {
              if (
                !confirm(
                  "Naozaj chcete vymazať tento poukaz? Tento krok je nezvratný.",
                )
              )
                return;
              coupon.remove();
            }}
          >
            <TrashIcon className="w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

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
      />
      <div className="p-4 pt-0">
        {coupons.length > 0 ? (
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-stone-200 *:px-3 *:py-0.5 first:*:rounded-tl-lg last:*:rounded-tr-lg">
                <th className="px-2 text-start text-sm font-semibold">Kód</th>
                <th className="px-2 text-start text-sm font-semibold">
                  Kontakt
                </th>
                <th className="text-end text-sm font-semibold">Suma</th>
                <th className="text-end text-sm font-semibold">
                  Platí do:{" "}
                  <span className="text-xs font-light text-gray-500">
                    (vrátane)
                  </span>
                </th>
                <th className=" text-center text-sm font-semibold">Stav</th>
                <th className="pe-2 text-end text-sm font-semibold">
                  Poznámka
                </th>
                <th className="pe-2 text-end text-sm font-semibold">
                  Použité pri
                </th>
                <th className="pe-2 text-end text-sm font-semibold">
                  Vytvorené z
                </th>
                <th className=""></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(({ coupon, contact }) => (
                <CouponRow key={coupon.id} coupon={coupon} contact={contact} />
              ))}
            </tbody>
          </table>
        ) : isFetchingContacts ? (
          <Loading text="Načítavam poukazy..." />
        ) : query ? (
          <div className="flex flex-col items-center p-10">
            <MagnifyingGlassIcon className="w-12 text-gray-400 animate-wiggle" />
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
