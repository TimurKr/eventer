"use client";

import { useEffect } from "react";
import { type Coupons, updateCoupon, deleteCoupon } from "./serverActions";
import NewCouponModal from "./modals/NewCouponModal";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { XCircleIcon as XCircleIconSolid } from "@heroicons/react/24/solid";
import { Badge, Datepicker } from "flowbite-react";
import Link from "next/link";
import Loading from "../events/loading";
import { useSearchParams } from "next/navigation";
import {
  InstantTextAreaField,
  InstantTextField,
} from "@/utils/forms/FormElements";
import { string as yupString, number as yupNumber, ref } from "yup";
import { toast } from "react-toastify";
import moment from "moment";
import { optimisticUpdate } from "@/utils/misc";
import UseCouponSelectEvent from "./modals/UseCouponSelectEventModal";
import { useStoreContext } from "../store";

export default function Coupons() {
  const {
    coupons,
    searchTerm,
    isRefreshing,
    search,
    refresh,
    setPartialCoupon,
    removeCoupon,
  } = useStoreContext((s) => s.coupons);

  const q = useSearchParams().get("query");
  useEffect(() => {
    if (q) search(q);
    refresh();
  }, []);

  const changeDate = async (coupon: Coupons, date: Date | null) => {
    const toastId = toast.loading(
      `${date ? "Aktualizujem" : "Vymazávam"} dátum platnosti`,
    );
    const r = await updateCoupon({
      id: coupon.id,
      valid_until: date?.toDateString(),
    });

    if (r.error) {
      toast.update(toastId, {
        render: r.error.message,
        type: "error",
        closeButton: true,
      });
      return;
    }

    setPartialCoupon({
      id: coupon.id,
      valid_until: date?.toDateString(),
    });
    toast.update(toastId, {
      render: "Dátum platnosti aktualizovaný",
      type: "success",
      isLoading: false,
      autoClose: 1500,
    });
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between gap-4 pb-2 pt-4">
          <span className="text-2xl font-bold tracking-wider">Kupóny</span>
          <div className="relative ms-auto max-w-64 grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 grid place-content-center">
              <MagnifyingGlassIcon className="h-8 w-8 p-2 text-gray-500" />
            </div>
            {searchTerm && (
              <button
                onClick={() => search("")}
                className="absolute right-0 top-0 grid h-full place-content-center px-2 text-gray-400 hover:scale-105 hover:text-gray-500 active:text-gray-600"
              >
                <XCircleIconSolid className="h-4 w-4" />
              </button>
            )}
            <input
              type="text"
              className="z-10 w-full rounded-md border-gray-200 bg-transparent px-8 py-0.5"
              placeholder="Hladať"
              value={searchTerm}
              onChange={(e) => search(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == "Escape") {
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key == "Enter") {
                  search(searchTerm);
                }
              }}
            />
          </div>
          <button
            className="flex items-center gap-2 rounded-md border border-gray-200 p-1 px-2 text-sm font-normal hover:bg-gray-100"
            onClick={refresh}
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${isRefreshing && "animate-spin"}`}
            />
            Obnoviť
          </button>
          <NewCouponModal />
        </div>
        <div>
          {coupons.length > 0 ? (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-slate-200 *:px-3 *:py-0.5 first:*:rounded-tl-lg last:*:rounded-tr-lg">
                  <th className="px-2 text-start text-sm font-semibold">Kód</th>
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
                    Použité
                  </th>
                  <th className="pe-2 text-end text-sm font-semibold">
                    Vytvorené z
                  </th>
                  <th className=""></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t first:border-none">
                    <td className="p-1 px-2">{coupon.code}</td>
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
                        setLocalValue={(value) =>
                          setPartialCoupon({
                            id: coupon.id,
                            amount: parseFloat(value!),
                          })
                        }
                        updateDatabase={(value) =>
                          updateCoupon({
                            id: coupon.id,
                            amount: parseFloat(value!),
                          })
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
                        setLocalValue={(value) =>
                          setPartialCoupon({
                            id: coupon.id,
                            original_amount: parseFloat(value!),
                          })
                        }
                        updateDatabase={(value) =>
                          updateCoupon({
                            id: coupon.id,
                            original_amount: parseFloat(value!),
                          })
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
                                  changeDate(coupon, date)
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
                                {moment(coupon.valid_until)
                                  .endOf("day")
                                  .fromNow()}
                              </p>
                            </div>
                            <button
                              className="p-2 transition-all duration-100 hover:scale-110 hover:text-red-500 active:text-red-700"
                              onClick={() => changeDate(coupon, null)}
                            >
                              <XCircleIcon className="w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="px-2 text-gray-500">-</p>
                            <button
                              className="p-2 transition-all duration-100 hover:scale-110 hover:text-green-500 active:text-green-700"
                              onClick={() =>
                                changeDate(
                                  coupon,
                                  moment().add(1, "month").toDate(),
                                )
                              }
                            >
                              <PlusCircleIcon className="w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      {coupon.valid ? (
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
                        defaultValue={coupon.note}
                        placeholder="Poznámka"
                        setLocalValue={(value) =>
                          setPartialCoupon({ id: coupon.id, note: value })
                        }
                        updateDatabase={(value) =>
                          updateCoupon({
                            id: coupon.id,
                            note: value,
                          })
                        }
                      />
                    </td>
                    <td>
                      {coupon.redeemed_from.length > 0 ? (
                        <div className="flex w-full items-center justify-end px-2 text-end text-xs text-gray-500">
                          ({coupon.redeemed_from.length})
                          <Link
                            href={{
                              pathname: "/dashboard/events",
                              query: {
                                query:
                                  "=" +
                                  coupon.redeemed_from
                                    .map((t) => t.id)
                                    .join("|="),
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
                      {coupon.created_from.length > 0 ? (
                        <div className="flex w-full items-center justify-end px-2 text-end text-xs text-gray-500">
                          ({coupon.created_from.length})
                          <Link
                            href={{
                              pathname: "/dashboard/events",
                              query: {
                                query:
                                  "=" +
                                  coupon.created_from
                                    .map((t) => t.id)
                                    .join("|="),
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
                        {coupon.valid && (
                          <UseCouponSelectEvent couponCode={coupon.code} />
                        )}
                        <button
                          className="p-2 transition-all duration-100 hover:scale-110 hover:text-red-500 active:text-red-700"
                          onClick={() =>
                            optimisticUpdate<Coupons, "id">({
                              confirmation:
                                "Naozaj chcete vymazať tento kupón? Tento krok je nezvratný." +
                                (coupon.created_from.length > 0 ||
                                coupon.redeemed_from.length > 0
                                  ? "\n\nVymazanie tohoto kupónu nijako neovplyvní lískty, na ktoré bol kupón už použitý, alebo z ktorých bol vytvorený."
                                  : ""),
                              value: { id: coupon.id },
                              localUpdate: removeCoupon,
                              databaseUpdate: deleteCoupon,
                              localRevert: refresh,
                              loadingMessage: "Vymazávam kupón",
                              successMessage: "Kupón vymazaný",
                            })
                          }
                        >
                          <TrashIcon className="w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : isRefreshing ? (
            <Loading />
          ) : (
            <div className="flex flex-col items-center gap-2 p-10 text-sm text-gray-500">
              Namáte žiadne vytvorené kupóny
              <NewCouponModal />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
