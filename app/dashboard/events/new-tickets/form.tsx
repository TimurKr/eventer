"use client";

import {
  CustomComboBox,
  CustomErrorMessage,
  FormikSelectField,
  FormikTextField,
  SubmitButton,
} from "@/utils/forms/FormElements";
import { Contacts, Coupons } from "@/utils/supabase/database.types";
import { Alert, Button, Modal } from "flowbite-react";
import { FieldArray, Form, Formik, FormikHelpers, FormikProps } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import {
  CurrencyEuroIcon,
  PlusCircleIcon,
  SquaresPlusIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/solid";
import {
  bulkInsertTickets,
  validateCouponCode,
  redeemCoupon,
  bulkUpsertContacts,
} from "../serverActions";
import { HiExclamationTriangle } from "react-icons/hi2";
import { toast } from "react-toastify";
import { contactsEqual } from "../utils";
import CouponCodeField from "../_modals/CouponCodeField";
import { useStoreContext } from "../../store";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTicketsForm({
  eventId,
  couponCode,
}: {
  eventId: string;
  couponCode?: string;
}) {
  const router = useRouter();

  const [coupon, setCoupon] = useState<Coupons | undefined | null>(undefined);

  const { event, refresh, ticketTypes, setPartialCoupon, contacts } =
    useStoreContext((state) => {
      let event = state.events.allEvents.find(
        (e) => e.id.toString() === eventId,
      );
      return {
        event,
        refresh: state.events.refresh,
        ticketTypes:
          state.services.services
            .find((s) => event?.service_id === s.id)
            ?.ticket_types.map((t) => ({
              ...t,
              sold:
                event?.tickets.filter((ticket) => ticket.type_id == t.id)
                  .length || 0,
            })) || [],
        setPartialCoupon: state.coupons.setPartialCoupon,
        contacts: state.events.contacts,
      };
    });

  const validationSchema = Yup.object({
    billingName: Yup.string()
      .min(2, "Zadajte aspoň 2 znaky")
      .required("Meno je povinné"),
    billingEmail: Yup.string().email("Zadajte platný email").optional(),
    billingPhone: Yup.string().optional(),
    paymentStatus: Yup.mixed()
      .oneOf(["zaplatené", "rezervované", "zrušené"])
      .required("Musíte zadať stav platby"),
    tickets: Yup.array()
      .of(
        Yup.object({
          name: Yup.string().min(2, "Zadajte aspoň 2 znaky").optional(),
          email: Yup.string().email("Zadajte platný email").optional(),
          phone: Yup.string().optional(),
          type_id: Yup.number()
            .oneOf(
              ticketTypes.map((t) => t.id),
              "Zadajte platnú možnosť",
            )
            .required("Musíte zadať typ"),
          price: Yup.number().required("Cena je povinná"),
        }),
      )
      .required("Musíte pridať aspoň jeden lístok")
      .min(1, "Musíte pridať aspoň jeden lístok"),
  });

  type TicketOrderType = Yup.InferType<typeof validationSchema>;

  const initialValues: TicketOrderType = {
    billingName: "",
    tickets:
      ticketTypes.length > 0
        ? [
            {
              type_id: ticketTypes[0].id,
              price: ticketTypes[0].price,
            },
          ]
        : [],
    paymentStatus: "rezervované",
  };

  const onSubmit = async (
    values: TicketOrderType,
    { setErrors }: FormikHelpers<TicketOrderType>,
  ) => {
    const { data: billingContacts, error: billingError } =
      await bulkUpsertContacts([
        {
          name: values.billingName,
          email: values.billingEmail,
          phone: values.billingPhone,
        },
      ]);
    if (billingError) {
      setErrors({
        tickets:
          "Chyba pri vytváraní fakturačného kontaktu: " + billingError.message,
      });
      return;
    }
    const billingContact = billingContacts[0];
    const { data: guestContacts, error: guestsError } =
      await bulkUpsertContacts(
        values.tickets
          .map(
            (ticket) =>
              ({
                name: ticket.name || values.billingName,
                email: ticket.email || values.billingEmail,
                phone: ticket.phone || values.billingPhone,
              }) as Contacts,
          )
          .filter(
            (ticket, i, a) =>
              i === a.findIndex((t) => contactsEqual(t, ticket)),
          ),
      );
    if (guestsError) {
      setErrors({ tickets: "Chyba pri vytváraní kontaktov: " + guestsError });
      return;
    }
    const { data: createdTickets, error } = await bulkInsertTickets(
      values.tickets.map((ticket) => ({
        billing_id: billingContact!.id,
        guest_id: guestContacts.find((c) =>
          contactsEqual(c, {
            name: ticket.name || values.billingName!,
            email: ticket.email || values.billingEmail || "",
            phone: ticket.phone || values.billingPhone || "",
            address: "",
          }),
        )!.id,
        event_id: event!.id,
        type_id: ticket.type_id,
        price: ticket.price,
        payment_status: values.paymentStatus as string,
        coupon_redeemed_id: coupon?.id || null,
      })),
    );
    if (error) {
      setErrors({ tickets: "Chyba pri vytváraní lístkov: " + error });
      return;
    }
    await refresh();
    if (coupon) {
      const couponAmountUpdate = await redeemCoupon(
        coupon.id,
        coupon.amount -
          Math.min(
            coupon.amount,
            createdTickets.map((t) => t.price).reduce((a, b) => a + b, 0),
          ),
      );
      if (couponAmountUpdate.error) {
        setErrors({
          tickets: "Chyba pri aplikovaní kupónu: " + couponAmountUpdate.error,
        });
        return;
      }
      setPartialCoupon({
        id: coupon.id,
        amount:
          coupon.amount -
          Math.min(
            coupon.amount,
            createdTickets.map((t) => t.price).reduce((a, b) => a + b, 0),
          ),
      });
    }

    toast.success("Lístky boli vytvorené", { autoClose: 1500 });
    router.back();
  };

  if (event === undefined) {
    return redirect("/dashboard/events");
  }

  if (ticketTypes.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center gap-2">
        <p>Na zvolenú udalosť neexistujú typy lístkov</p>
        <Link
          href={`/dashboard/services/edit?serviceId=${event?.service_id}`}
          className="rounded-lg bg-gray-100 px-2 py-1 text-center text-sm text-gray-600 hover:bg-gray-200"
        >
          Vytvoriť typ lístkov
        </Link>
      </div>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({
        values,
        isSubmitting,
        errors,
        getFieldMeta,
        getFieldHelpers,
        setFieldValue,
        validateField,
      }: FormikProps<TicketOrderType>) => (
        <Form>
          <p className="ps-1 font-bold">Fakturčné údaje</p>
          <div className="flex gap-2 rounded-xl border border-gray-400 p-2">
            {/* {getFieldMeta("billingName").value} */}
            <CustomComboBox
              options={contacts as Partial<Contacts>[]}
              displayFun={(c) => c?.name || ""}
              searchKeys={["name"]}
              newValueBuilder={(input) => ({ name: input })}
              onSelect={async (contact) => {
                await setFieldValue("billingName", contact.name, true);
                if (contact.id) {
                  await setFieldValue("billingEmail", contact.email, true);
                  await setFieldValue("billingPhone", contact.phone, true);
                }
                // await validateField("billingName");
                console.log(values);
              }}
              label="Meno"
              placeholder="Adam Kováč"
              vertical
              iconStart={<UserCircleIcon className="h-4 w-4 text-gray-500" />}
              error={
                <CustomErrorMessage fieldMeta={getFieldMeta("billingName")} />
              }
            />

            <FormikTextField
              // type="email"
              name="billingEmail"
              label="Email"
              placeHolder="adam.kovac@gmail.com"
              optional
              vertical
            />
            <FormikTextField
              name="billingPhone"
              label="Telefón"
              placeHolder="0900 123 456"
              optional
              vertical
            />
            <FormikSelectField name="paymentStatus" label="Stav" vertical>
              <option value="zaplatené">Zaplatené</option>
              <option value="rezervované">Rezervované</option>
              <option value="zrušené">Zrušené</option>
            </FormikSelectField>
          </div>
          <p className="ps-1 pt-4 font-bold">Lístky</p>
          <div className="rounded-xl border border-gray-400 p-2">
            <FieldArray name="tickets">
              {(ticketsProps) => (
                <>
                  {values.tickets && values.tickets.length > 0 && (
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="px-2 text-start text-sm font-normal text-gray-500">
                            Meno
                          </th>
                          <th className="px-2 text-start text-sm font-normal text-gray-500">
                            Email
                          </th>
                          <th className="px-2 text-start text-sm font-normal text-gray-500">
                            Telefón
                          </th>
                          <th className="px-2 text-start text-sm font-normal text-gray-500">
                            Typ
                          </th>
                          <th className="px-2 text-start text-sm font-normal text-gray-500">
                            Cena
                          </th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {values.tickets.map((ticket, index) => (
                          <tr key={index}>
                            <td className="px-1">
                              <FormikTextField
                                name={`tickets[${index}].name`}
                                placeHolder={values.billingName || "Adam Kováč"}
                                optional
                                vertical
                              />
                            </td>
                            <td className="px-1">
                              <FormikTextField
                                name={`tickets[${index}].email`}
                                placeHolder={values.billingEmail || "-"}
                                optional
                                vertical
                              />
                            </td>
                            <td className="px-1">
                              <FormikTextField
                                name={`tickets[${index}].phone`}
                                placeHolder={values.billingPhone || "-"}
                                optional
                                vertical
                              />
                            </td>
                            <td className="px-1">
                              <FormikSelectField
                                name={`tickets[${index}].type_id`}
                                className={
                                  ticketTypes.find(
                                    (t) => t.id == ticket.type_id,
                                  )?.is_vip
                                    ? "border-yellow-200 bg-yellow-100 text-yellow-600"
                                    : ""
                                }
                                onChange={(v: string) => {
                                  getFieldHelpers(
                                    `tickets[${index}].price`,
                                  ).setValue(
                                    ticketTypes.find((t) => t.id == parseInt(v))
                                      ?.price || 0,
                                  );
                                }}
                              >
                                {ticketTypes.map((type) => (
                                  <option value={type.id} key={type.id}>
                                    {type.label}
                                  </option>
                                ))}
                              </FormikSelectField>
                            </td>
                            <td className="px-1">
                              <FormikTextField
                                name={`tickets[${index}].price`}
                                type="number"
                                vertical
                                iconEnd={
                                  <CurrencyEuroIcon className="pointer-events-none h-4 w-4" />
                                }
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="self-center p-2 text-red-600 hover:text-red-700"
                                onClick={() => ticketsProps.remove(index)}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div className="flex justify-center">
                    <CustomErrorMessage fieldMeta={getFieldMeta("tickets")} />
                  </div>
                  <div className="flex w-full flex-row flex-wrap items-end justify-end gap-2 pt-4">
                    {ticketTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        className={`flex items-center gap-1 rounded-lg border border-gray-200 p-0 px-2 py-1 text-sm ${
                          type.is_vip
                            ? "border-yellow-200 bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                            : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        onClick={() =>
                          ticketsProps.push({
                            type_id: type.id,
                            price: type.price,
                          })
                        }
                      >
                        {
                          values.tickets.filter((t) => t.type_id == type.id)
                            .length
                        }
                        {type.capacity && `/${type.capacity - type.sold}`}{" "}
                        {type.label}
                        <PlusCircleIcon className="h-5 w-5" />
                      </button>
                    ))}
                    <Link
                      href={`/dashboard/services/edit?serviceId=${event?.service_id}`}
                      className="rounded-lg p-2 text-gray-600 transition-all hover:scale-110 hover:text-gray-700"
                      title="Pridať typ lístka"
                    >
                      <SquaresPlusIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </>
              )}
            </FieldArray>
          </div>

          {ticketTypes.map((type) => {
            const afterSaleCount =
              type.sold +
              values.tickets.filter((t) => t.type_id == type.id).length;
            if (type.capacity && afterSaleCount > type.capacity) {
              return (
                <Alert
                  color="warning"
                  icon={HiExclamationTriangle}
                  className="my-2"
                  key={type.id}
                >
                  Po vytvorení bude {afterSaleCount} lístkov typu{" "}
                  <span className="font-semibold">{type.label}</span>, čo je
                  viac ako povolených {type.capacity}.
                </Alert>
              );
            }
          })}
          <div className="my-6 flex flex-row items-center gap-4">
            <span className="shrink text-lg font-medium">Rekapitulácia</span>
            <div className="h-px grow bg-gray-300" />
          </div>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="pe-6 ps-2">Lístky</td>
                <td className="px-2 text-end">
                  {values.tickets.reduce((a, b) => a + b.price, 0)} €
                </td>
              </tr>
              <tr>
                <td className="py-2 pe-6 ps-2">
                  <CouponCodeField
                    defaultCode={couponCode}
                    coupon={coupon}
                    setCoupon={setCoupon}
                    validate={async (code) => validateCouponCode(code)}
                  />
                </td>
                <td className="px-2 text-end">
                  {coupon
                    ? -Math.min(
                        coupon.amount,
                        values.tickets.reduce((a, b) => a + b.price, 0),
                      )
                    : 0}{" "}
                  €
                </td>
              </tr>
              <tr className="border-t font-bold">
                <td className="px-2">Spolu</td>
                <td className="px-2 text-end">
                  {Math.max(
                    values.tickets.reduce((a, b) => a + b.price, 0) -
                      (coupon ? coupon.amount : 0),
                    0,
                  )}{" "}
                  €
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-end gap-4">
            <SubmitButton
              isSubmitting={isSubmitting}
              label="Vytvoriť"
              submittingLabel="Vytváram..."
              className="m-0"
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}
