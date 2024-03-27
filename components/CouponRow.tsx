"use client";

import InlineLoading from "@/components/InlineLoading";
import { InstantTextField } from "@/components/forms/InstantFields";
import DatePicker from "@/components/inputs/DatePicker";
import { SelectContactDialog } from "@/components/inputs/SelectContactDialog";
import TextAreaInputDialog from "@/components/inputs/TextAreaInputDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import {
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
  UserIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { formatDistance } from "date-fns";
import { sk } from "date-fns/locale";
import moment from "moment";
import Link from "next/link";
import { useCallback, useState } from "react";
import { number as yupNumber } from "yup";
import UseCouponSelectEvent from "../app/dashboard/coupons/modals/UseCouponSelectEventModal";
import { validateCoupon } from "../app/dashboard/coupons/utils";

export default function CouponRow({
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
                  onSelected={(c) => coupon.patch({ contact_id: c.id })}
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
              onSelected={(c) => coupon.patch({ contact_id: c.id })}
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
        <div className="min-w-20 px-2 text-end">
          <span className="whitespace-nowrap">
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
            z
          </span>{" "}
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
                <DatePicker
                  value={new Date(coupon.valid_until)}
                  onChange={(date) =>
                    coupon.incrementalPatch({
                      valid_until: date?.toISOString(),
                    })
                  }
                  presets={[
                    { label: "O týždeň", value: 7 },
                    { label: "O mesiac", value: 30 },
                    { label: "O 3 mesiace", value: 90 },
                    { label: "O pol roka", value: 180 },
                    { label: "O rok", value: 365 },
                  ]}
                  buttonProps={{ className: "h-auto w-auto px-2 py-1" }}
                />
                <p className="px-2 text-end text-xs text-gray-500">
                  {(moment(coupon.valid_until).endOf("day") >= moment()
                    ? "o "
                    : "pred ") +
                    formatDistance(new Date(coupon.valid_until), new Date(), {
                      locale: sk,
                    })}
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
            <Badge variant="default">Platné</Badge>
          </div>
        ) : (
          <div className="mx-auto w-fit">
            <Badge variant="secondary" className="w-fit">
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
