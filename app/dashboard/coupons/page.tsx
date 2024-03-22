"use client";

import InlineLoading from "@/components/InlineLoading";
import Loading from "@/components/Loading";
import { SelectContactDialog } from "@/components/SelectContact";
import TextAreaInputDialog from "@/components/TextAreaInputDialog";
import { InstantTextField } from "@/components/forms/InstantFields";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import {
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
  UserIcon,
  UserPlusIcon,
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
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);

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
    <TableRow key={coupon.id} className="border-t first:border-none">
      <TableCell className="p-1 px-2">{coupon.code}</TableCell>
      <TableCell>
        <div className="flex justify-center">
          {contact ? (
            <DropdownMenu
              open={contactDropdownOpen}
              onOpenChange={setContactDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant={"link"}>{contact.name}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/contacts/${contact?.id}`}>
                    <PencilIcon className="me-2 h-4 w-4" />
                    Upraviť kontakt
                  </Link>
                </DropdownMenuItem>
                <SelectContactDialog
                  onSelected={(c) => console.error("not implemented")}
                  onClosed={() => setContactDropdownOpen(false)}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UserIcon className="me-2 h-4 w-4" />
                    Vybrať iný kontakt
                  </DropdownMenuItem>
                </SelectContactDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SelectContactDialog
              onSelected={(c) => console.error("not implemented")}
              onClosed={() => setContactDropdownOpen(false)}
            >
              <Button variant={"ghost"} size="icon">
                <UserPlusIcon className="h-4 w-4" />
              </Button>
            </SelectContactDialog>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className=" px-2 text-end">
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
              (
                await coupon.patch({ amount: parseFloat(value!) })
              ).amount.toString()
            }
          />{" "}
          /{" "}
          <span className="whitespace-nowrap">
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
                (
                  await coupon.patch({ original_amount: parseFloat(value!) })
                ).original_amount.toString()
              }
            />{" "}
            €
          </span>
        </div>
      </TableCell>
      <TableCell className="">
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
      </TableCell>
      <TableCell className="text-center">
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
      </TableCell>
      <TableCell className="text-end">
        <TextAreaInputDialog
          title="Poznámka ku poukazu"
          value={coupon.note}
          onSave={(note) => coupon.incrementalPatch({ note })}
          onReset={() => coupon.incrementalPatch({ note: "" })}
        >
          {coupon.note ? (
            <button className="max-w-40 truncate text-end underline-offset-4 hover:underline">
              {coupon.note}
            </button>
          ) : (
            <Button variant={"ghost"} size={"icon"}>
              <PlusCircleIcon className="h-4" />
            </Button>
          )}
        </TextAreaInputDialog>
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
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
