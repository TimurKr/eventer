"use client";

import {
  CustomComboBox,
  InstantTextAreaField,
  InstantTextField,
} from "@/utils/forms/FormElements_dep";
import { optimisticUpdate } from "@/utils/misc";
import {
  ArrowTopRightOnSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Badge, Datepicker } from "flowbite-react";
import moment from "moment";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { number as yupNumber, string as yupString } from "yup";
import Header from "../components/Header";
import {
  Contacts,
  bulkUpsertContacts,
  mergeContacts,
  updateContactFields,
} from "../events/serverActions";
import { useStoreContext } from "../store";
import UseCouponSelectEvent from "./modals/UseCouponSelectEventModal";
import NewCouponButton from "./new/button";
import NewCouponForm from "./new/form";
import { deleteCoupon, updateCoupon, type Coupons } from "./serverActions";

export default function Coupons() {
  const {
    coupons: {
      coupons,
      searchTerm,
      isRefreshing,
      search,
      refresh: refreshCoupons,
      setPartialCoupon,
      removeCoupon,
    },
    events: {
      contacts,
      addContacts,
      refresh: refreshContacts,
      setPartialContact,
    },
  } = useStoreContext((s) => s);

  const q = useSearchParams().get("query");
  useEffect(() => {
    if (q) search(q);
  }, [q, search]);

  const changeDate = async (coupon: Coupons, date: Date | null) =>
    optimisticUpdate({
      value: { id: coupon.id, valid_until: date?.toDateString() || null },
      localUpdate: setPartialCoupon,
      databaseUpdate: updateCoupon,
      localRevert: () => setPartialCoupon(coupon),
      loadingMessage: `${date ? "Aktualizujem" : "Vymazávam"} dátum platnosti`,
      successMessage: "Dátum platnosti aktualizovaný",
    });

  return (
    <>
      <div>
        <Header
          title="Poukazy"
          actionButton={<NewCouponButton />}
          refresh={{ refresh: refreshCoupons, isRefreshing }}
          search={{ search, searchTerm, results: coupons.length }}
        />
        <div>
          {coupons.length > 0 ? (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-slate-200 *:px-3 *:py-0.5 first:*:rounded-tl-lg last:*:rounded-tr-lg">
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
                    Použité
                  </th>
                  <th className="pe-2 text-end text-sm font-semibold">
                    Vytvorené z
                  </th>
                  <th className=""></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const contact = contacts.find(
                    (c) => c.id == coupon.contact_id,
                  );
                  return (
                    <tr key={coupon.id} className="border-t first:border-none">
                      <td className="p-1 px-2">{coupon.code}</td>
                      <td>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 py-0.5">
                          <CustomComboBox
                            options={contacts as Partial<Contacts>[]}
                            displayFun={(c) => c?.name || ""}
                            searchKeys={["name"]}
                            newValueBuilder={(input) => ({ name: input })}
                            defaultValue={contact}
                            optional
                            inline
                            onSelect={async (selectedContact) => {
                              if (!contact) {
                                // No contact for this coupon
                                if (selectedContact.id) {
                                  // Selected existing contact
                                  optimisticUpdate({
                                    value: {
                                      id: coupon.id,
                                      contact_id: selectedContact.id,
                                    },
                                    localUpdate: setPartialCoupon,
                                    databaseUpdate: updateCoupon,
                                    localRevert: refreshCoupons,
                                    loadingMessage:
                                      "Pridávam kontakt ku poukazu",
                                    successMessage: "Poukaz aktualizovaný",
                                  });
                                } else {
                                  // Selected new contact
                                  optimisticUpdate({
                                    value: {},
                                    localUpdate: () => {},
                                    databaseUpdate: async () => {
                                      const r = await bulkUpsertContacts([
                                        {
                                          name: selectedContact.name!,
                                        },
                                      ]);
                                      if (r.error) return r;
                                      return await updateCoupon({
                                        id: coupon.id,
                                        contact_id: r.data[0].id,
                                      });
                                    },
                                    localRevert: () => {
                                      refreshContacts();
                                      refreshCoupons();
                                    },
                                    loadingMessage:
                                      "Vytváram nový kontakt a priradzujem ho k poukazu",
                                    successMessage: "Poukaz aktualizovaný",
                                    onSuccessfulUpdate: async () => {
                                      refreshContacts();
                                      refreshCoupons();
                                    },
                                  });
                                }
                              } else {
                                // There is already a contact for this coupon
                                if (selectedContact.id) {
                                  // Selected existing contact
                                  if (selectedContact.id == contact.id) return;
                                  optimisticUpdate({
                                    value: {
                                      id: coupon.id,
                                      contact_id: selectedContact.id,
                                    },
                                    confirmation:
                                      "Zvolili ste si meno, ktoré už v databáze máte. K tomuto poukazu týmto priradíte už existujúci kontakt.",
                                    localUpdate: setPartialCoupon,
                                    databaseUpdate: updateCoupon,
                                    localRevert: () => {
                                      refreshCoupons();
                                    },
                                    loadingMessage:
                                      "Spájam kontakty a aktualizujem poukaz",
                                    successMessage: "Poukaz aktualizovaný",
                                  });
                                } else {
                                  // Selected new contact
                                  optimisticUpdate({
                                    value: {
                                      id: contact.id,
                                      name: selectedContact.name!,
                                    },
                                    localUpdate: setPartialContact,
                                    databaseUpdate: updateContactFields,
                                    localRevert: refreshContacts,
                                    loadingMessage: "Ukladám nové meno...",
                                    successMessage: "Meno uložené",
                                  });
                                }
                              }
                            }}
                          />
                          {contact && (
                            <>
                              <InstantTextField
                                defaultValue={contact.phone}
                                type="text"
                                inline
                                trim
                                placeholder="Telefón"
                                updateDatabase={async (value) => {
                                  const r = await updateContactFields({
                                    id: contact.id,
                                    phone: value || "",
                                  });
                                  if (!r.error || r.status != 409) return r;
                                  if (
                                    !confirm(
                                      "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
                                    )
                                  )
                                    return { terminate: true };
                                  const r2 = await mergeContacts(contact, {
                                    phone: value || "",
                                  });
                                  if (!r2.error) refreshContacts();
                                  return r2;
                                }}
                                setLocalValue={(value) =>
                                  setPartialContact({
                                    id: contact.id,
                                    phone: value || "",
                                  })
                                }
                              />
                              <InstantTextField
                                defaultValue={contact.email}
                                type="email"
                                inline
                                trim
                                placeholder="Email"
                                validate={(value) =>
                                  yupString()
                                    .email("Zadajte platný email")
                                    .validate(value)
                                    .then(() => null)
                                    .catch((err) => err.message)
                                }
                                updateDatabase={async (value) => {
                                  const r = await updateContactFields({
                                    id: contact.id,
                                    email: value || "",
                                  });
                                  if (!r.error || r.status != 409) return r;
                                  if (
                                    !confirm(
                                      "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
                                    )
                                  )
                                    return { terminate: true };
                                  const r2 = await mergeContacts(contact, {
                                    email: value || "",
                                  });
                                  if (!r2.error) refreshContacts();
                                  return r2;
                                }}
                                setLocalValue={(value) =>
                                  setPartialContact({
                                    id: contact.id,
                                    email: value || "",
                                  })
                                }
                              />
                              <button
                                type="button"
                                className={`p-1 ms-auto transition-all text-gray-600 duration-100 hover:scale-105 hover:text-red-500 active:text-red-700`}
                                onClick={() =>
                                  optimisticUpdate({
                                    value: {
                                      id: coupon.id,
                                      contact_id: null,
                                    },
                                    localUpdate: setPartialCoupon,
                                    databaseUpdate: updateCoupon,
                                    localRevert: refreshCoupons,
                                    loadingMessage:
                                      "Odstraňujem kontakt z poukazu",
                                    successMessage: "Poukaz aktualizovaný",
                                  })
                                }
                              >
                                <XCircleIcon
                                  className={`w-4 transition-transform`}
                                />
                              </button>
                              {/* <Link
                                href={`/dashboard/contacts/${contact.id.toString()}`}
                                className="p-1 transition-all duration-100 hover:scale-105 hover:text-blue-500 active:text-blue-700"
                              >
                                <ArrowTopRightOnSquareIcon className="w-4" />
                              </Link> */}
                            </>
                          )}
                        </div>

                        {/* <InstantTextField
                          defaultValue={contact?.name || ""}
                          type="text"
                          inline
                          trim
                          placeholder="Meno"
                          validate={async (value) =>
                            value == "" ? "Meno nesmie byť prázdne" : null
                          }
                          updateDatabase={async (value) => {
                            const r = await bulkUpsertContacts([
                              contact
                                ? {
                                    id: contact.id,
                                    name: value || "",
                                  }
                                : { name: value || "" },
                            ]);
                            if (r.error) return r;
                            if (
                              !confirm(
                                "Takýto kontakt už v databáze máte, táto operácia ich spojí.",
                              )
                            )
                              return { terminate: true };
                            if (contact){
                              const r2 = await mergeContacts(contact, {
                                name: value || "",
                              });
                              if (!r2.error) return r2;
                              return r2;
                            } else {
                              const r2 = await updateCoupon({
                                id: coupon.id,
                                contact_id: r.data[0].id,
                              });
                              if (!r2.error) refresh();
                          }}
                          setLocalValue={(value) => {
                            setPartialContact({
                              id: ticket.guest_id,
                              name: value || "",
                            });
                            search({});
                          }}
                        /> */}
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
                                type="button"
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
                                type="button"
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
                                  "Naozaj chcete vymazať tento poukaz? Tento krok je nezvratný." +
                                  (coupon.created_from.length > 0 ||
                                  coupon.redeemed_from.length > 0
                                    ? "\n\nVymazanie tohoto poukazu nijako neovplyvní lískty, na ktoré bol poukaz už použitý, alebo z ktorých bol vytvorený."
                                    : ""),
                                value: { id: coupon.id },
                                localUpdate: removeCoupon,
                                databaseUpdate: deleteCoupon,
                                localRevert: refreshCoupons,
                                loadingMessage: "Vymazávam poukaz",
                                successMessage: "Poukaz vymazaný",
                              })
                            }
                          >
                            <TrashIcon className="w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
      </div>
    </>
  );
}
